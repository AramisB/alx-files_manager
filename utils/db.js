import pkg from 'mongodb';

const { MongoClient } = pkg;

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(this.url);
    this.databaseName = database;
    this.isConnected = false;

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      this.isConnected = false;
    }
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    const db = this.client.db(this.databaseName);
    const count = await db.collection('users').countDocuments();
    return count;
  }

  async nbFiles() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    const db = this.client.db(this.databaseName);
    const count = await db.collection('files').countDocuments();
    return count;
  }

  getCollection(collectionName) {
    return this.client.db(this.databaseName).collection(collectionName);
  }

  async getUserFromToken(token) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    const db = this.client.db(this.databaseName);
    const user = await db.collection('users').findOne({ token });
    return user;
  }

  async insertFile(fileData) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    const db = this.client.db(this.databaseName);
    const result = await db.collection('files').insertOne(fileData);
    return result;
  }
}

const dbClient = new DBClient();
export default dbClient;
