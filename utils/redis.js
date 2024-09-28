import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient({
      url: 'redis://127.0.0.1:6379',
    });
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.isClientConnected = true;
    });

    this.getAsync = promisify(this.client.GET).bind(this.client);
    this.setAsync = promisify(this.client.SETEX).bind(this.client);
    this.delAsync = promisify(this.client.DEL).bind(this.client);
  }

  isAlive() {
    return this.isClientConnected;
  }

  async get(key) {
    return this.getAsync(key);
  }

  async set(key, value, duration) {
    await this.setAsync(key, value, {
      EX: duration,
    });
  }

  async del(key) {
    await this.de(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
