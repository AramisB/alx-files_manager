import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    res.status(200).json({ redis: redisStatus, db: dbStatus });
  },

  async getStats(req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      res.status(200).json({ users, files });
    } catch (error) {
      res.status(500).json({ error });
      return res.status(500).json({ error: 'Internal server error' });
    }

    return null;
  },
};

export default AppController;
