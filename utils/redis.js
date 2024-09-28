import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient({
      url: 'redis://127.0.0.1:6379',
    });

    this.client.on('error', (err) => {
      console.log('Redis Client Error', err);
    });

    this.connect();
  }

  async connect() {
    await this.client.connect();
  }

  isAlive() {
    return this.client.isOpen;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    await this.client.set(key, value, {
      EX: duration,
    });
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
