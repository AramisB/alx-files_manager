import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Base64 } from 'js-base64';
import path from 'path';
import mime from 'mime-types';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    // Retrieve user based on token
    const token = req.headers['x-token'];
    const user = await dbClient.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // If parentId is specified, validate it
    if (parentId !== 0) {
      const parentFile = await dbClient.findFileById(parentId);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const userId = user._id;
    let localPath = null;

    // Handle file or image type
    if (type === 'file' || type === 'image') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileUuid = uuidv4();
      const ext = mime.extension(type === 'image' ? 'image/jpeg' : 'application/octet-stream');
      localPath = path.join(folderPath, `${fileUuid}.${ext}`);

      // Save the file locally
      const fileData = Base64.decode(data);
      fs.writeFileSync(localPath, fileData, 'binary');
    }

    // Create the file document
    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };

    const insertedFile = await dbClient.insertFile(newFile);

    return res.status(201).json(insertedFile);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const user = await dbClient.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId);

    if (!file || file.userId !== user._id) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const user = await dbClient.getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const pageSize = 20;
    const skip = page * pageSize;

    const files = await dbClient.findFilesByUserAndParentId(user._id, parentId, skip, pageSize);
    return res.status(200).json(files);
  }
}

export default FilesController;
