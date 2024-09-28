import redisClient from "../utils/redis.js";
import dbClient from "../utils/db.js";
// GET /status should return if Redis is alive and if the DB is alive too by using the 2 utils created previously: { "redis": true, "db": true } with a status code 200
const AppController = {
    getStatus(req, res) {
        const redisStatus = redisClient.isAlive();
        const dbStatus = dbClient.isAlive();
        res.status(200).json({ redis: redisStatus, db: dbStatus });
    },

// GET /stats should return the number of users and files in DB: { "users": 12, "files": 1231 } with a status code 200
// users collection must be used for counting all users
// files collection must be used for counting all files

    getStats(req, res) {
        const users = dbClient.nbUsers();
        const files = dbClient.nbFiles();
        res.status(200).json({ users: users, files: files });
    }
};

export default AppController;