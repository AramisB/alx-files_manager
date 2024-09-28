import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const usersQueue = new Queue('users');

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ Error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ Error: 'Missing password' });
      return;
    }
    const user = await dbClient.getCollection('users').findOne({ email });
    if (user) {
      res.status(400).json({ Error: 'User already exists' });
      return;
    }
    const insertInfo = await dbClient.getCollection('users').insertOne({ email, password: sha1(password) });
    const userId = insertInfo.insertedId.toString();

    usersQueue.add({ userId });
    res.status(201).json({ email, id: userId });
  }

  static async getMe(req, res) {
    const user = req;

    res.status(200).json({
      email: user.email,
      id: user._id.toString(),
    });
  }
}
