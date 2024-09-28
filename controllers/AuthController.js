import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const AuthController = {
  getConnect: async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const [authType, base64credentials] = authHeader.split(' ');
      if (authType !== 'Basic' || !base64credentials) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const credentials = Buffer.from(base64credentials, 'base64').toString('utf-8');
      const [email, password] = credentials.split(':');

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }
      const user = await dbClient.getCollection('users').findOne({ email: email.trim() });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();

      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

      res.status(200).json({ token });
    } catch (error) {
      console.log('Error connecting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return null;
  },
  getDisconnect: async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await redisClient.del(`auth_${token}`);
      res.status(200).json({ message: 'User disconnected' });
    } catch (error) {
      console.log('Error disconnecting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return null;
  },
};

export default AuthController;
