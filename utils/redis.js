import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379',
    });
    this.isClientConnected = false;

    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });

    this.client.on('connect', () => {
      this.isClientConnected = true;
      console.log('Connected to Redis');
    });

    this.client.on('ready', () => {
      this.isClientConnected = true;
      console.log('Redis client is ready');
    });

    this.client.on('end', () => {
      this.isClientConnected = false;
      console.log('Redis client connection closed');
    });
    this.client.on('reconnecting', (info) => {
      console.log(`Reconnecting to Redis: Attempt ${info.attempt}`);
    });
  }

  isAlive() {
    return this.isClientConnected;
  }

  async get(key) {
    if (!this.isClientConnected) {
      throw new Error('Redis client is not connected');
    }
    return promisify(this.client.GET).bind(this.client)(key);
  }

  async set(key, value, duration) {
    if (!this.isClientConnected) {
      throw new Error('Redis client is not connected');
    }
    return promisify(this.client.SETEX)
      .bind(this.client)(key, duration, value);
  }

  async del(key) {
    if (!this.isClientConnected) {
      throw new Error('Redis client is not connected');
    }
    return promisify(this.client.DEL).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
