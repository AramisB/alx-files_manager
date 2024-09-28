import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();
    res.status(200).json({ redis: redisStatus, db: dbStatus });
  },

  getStats(req, res) {
    const users = dbClient.nbUsers();
    const files = dbClient.nbFiles();
    res.status(200).json({ users, files });
  },
};

export default AppController;
