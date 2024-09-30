import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis'; // Assuming you have a redis client configured
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(req, res) {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is provided
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode the Base64 string
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Hash the password
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Find the user in the database
    const user = await dbClient.getCollection('users').findOne({ email, password: hashedPassword });

    // Check if user is found
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a random string as token
    const token = uuidv4();
    const userId = user._id.toString(); // Get the user ID

    // Check if the Redis client is connected
    if (!redisClient.isAlive()) {
      console.error('Redis client is not alive, cannot set token');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Set the token in Redis with 24 hours expiration
    try {
      await redisClient.set(`auth_${token}`, userId, 60 * 60 * 24); // Set with expiration
      // Return the token
      return res.status(200).json({ token });
    } catch (err) {
      console.error('Redis error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await dbClient.getUserIdByToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the Redis client is connected
    if (!redisClient.isAlive()) {
      console.error('Redis client is not alive, cannot delete token');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    try {
      await redisClient.del(`auth_${token}`);
      return res.status(204).end();
    } catch (err) {
      console.error('Redis error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await dbClient.getUserIdByToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.getCollection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json(user);
  }
}
