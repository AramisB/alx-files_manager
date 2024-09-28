import bkg from 'mongodb';
import bcrypt from 'bcrypt';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = bkg;

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    // Validation checks
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    try {
      const db = dbClient.client.db(dbClient.databaseName);
      const userCollection = db.collection('users');

      // Check if the user already exists
      const checkUser = await userCollection.findOne({ email });
      if (checkUser) return res.status(400).json({ error: 'Already exists' });

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object
      const userId = new ObjectId();
      const user = {
        _id: userId,
        email,
        password: hashedPassword,
      };

      // Insert the new user
      await userCollection.insertOne(user);

      // Respond with the new user's email and ID
      res.status(201).json({ email, id: userId.toString() });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return null;
  },

  async getMe(req, res) {
    try {
      // Retrieve the token from request headers
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user ID associated with the token from Redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Convert the userId to an ObjectId type for MongoDB query
      const userObjectId = new ObjectId(userId);
      const db = dbClient.client.db(dbClient.databaseName);
      const userCollection = db.collection('users');

      // Find the user by ID
      const user = await userCollection.findOne({ _id: userObjectId });

      // If user is not found, return an error
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Respond with the user's email and ID
      res.status(200).json({ email: user.email, id: user._id.toString() });
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(200).json({ message: 'User retrieved' });
  },
};
export default UsersController;
