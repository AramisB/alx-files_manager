import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import dbClient from '../utils/db';

const UsersController = {
  // Endpoint to create a new user
  async postNew(req, res) {
    const { email, password } = req.body;

    // Validate email and password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the email already exists
    const existingUser = await dbClient.getCollection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exists' });
    }

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Create a new user object
    const newUser = {
      email,
      password: hashedPassword,
    };

    try {
      // Save the new user in the database
      const result = await dbClient.getCollection('users').insertOne(newUser);
      return res.status(201).json({
        id: result.insertedId.toString(),
        email: newUser.email,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Endpoint to get current user information
  async getMe(req, res) {
    const token = req.headers['x-token'];

    // Validate the token
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the user ID associated with the token from Redis or your session store
    const userId = await dbClient.getUserIdByToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const user = await dbClient.getCollection('users').findOne({ _id: new ObjectId(userId) });

      // If user is not found, return an error
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Respond with the user's email and ID
      res.status(200).json({ email: user.email, id: user._id.toString() });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
    return null;
  },
};

export default UsersController;
