import redis from "redis"

class redisClient {

    constructor() {
        this.client = redis.createClient({
            url: 'redis.//27.0.0.1:6379',
        });

        this.client.on('error', (err) => {
            console.log(err);
        });

        this.client.connect().catch((err) => {
            console.log(err);
        });
    }
    isAlive() {
        return this.client.isOpen();        
    }
    
    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }
    async set(key, value, duration) {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, 'EX', duration, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }
    async del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    }
}

const redisClient = new redisClient();
export default redisClient;