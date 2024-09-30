import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

// Default folder path
const DEFAULT_FOLDER_PATH = path.resolve(process.env.FOLDER_PATH || '/tmp/files_manager');

// Ensure the directory exists
if (!fs.existsSync(DEFAULT_FOLDER_PATH)) {
  fs.mkdirSync(DEFAULT_FOLDER_PATH, { recursive: true });
}

export default class FilesController {
  // Create a new file
  static async postUpload(req, res) {
    const {
      name, type, parentId, isPublic = false, data,
    } = req.body;
    const token = req.headers['X-Token']; // Adjusted to look for X-Token

    const user = await dbClient.getUserFromToken(token); // Directly call dbClient method
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parentFile;
    if (parentId) {
      parentFile = await dbClient.getCollection('files').findOne({ _id: parentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileData = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    };

    if (type !== 'folder') {
      const fileUUID = uuidv4();
      const filePath = path.join(DEFAULT_FOLDER_PATH, fileUUID);

      // Write the file to disk
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, buffer);

      fileData.localPath = filePath;
    }

    // Insert file data using dbClient method
    await dbClient.insertFile(fileData);
    return res.status(201).json(fileData); // Return fileData instead of newFile
  }

  // Get file by ID
  static async getShow(req, res) {
    const token = req.headers['X-Token'];
    const { id } = req.params;

    const user = await dbClient.getUserFromToken(token); // Directly call dbClient method
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getCollection('files').findOne({ _id: id, userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(file);
  }

  // Get files with pagination
  static async getIndex(req, res) {
    const token = req.headers['X-Token'];
    const { parentId = 0, page = 0 } = req.query;

    const user = await dbClient.getUserFromToken(token); // Directly call dbClient method
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = await dbClient.getCollection('files').find({ userId: user._id, parentId })
      .limit(20)
      .skip(page * 20);

    return res.json(files);
  }

  // Publish a file
  static async publish(req, res) {
    const token = req.headers['X-Token'];
    const { id } = req.params;

    const user = await dbClient.getUserFromToken(token); // Directly call dbClient method
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getCollection('files').findOne({ _id: id, userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = true;
    await dbClient.getCollection('files').updateOne({ _id: id }, { $set: { isPublic: true } });
    return res.json(file);
  }

  // Unpublish a file
  static async unpublish(req, res) {
    const token = req.headers['X-Token'];
    const { id } = req.params;

    const user = await dbClient.getUserFromToken(token); // Directly call dbClient method
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getCollection('files').findOne({ _id: id, userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = false;
    await dbClient.getCollection('files').updateOne({ _id: id }, { $set: { isPublic: false } });
    return res.json(file);
  }
}
