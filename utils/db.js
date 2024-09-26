class DBClient {
    constructor() {
        this.client = null;
        this.host = process.env.DB_HOST || 'localhost';
        this.port = process.env.DB_PORT || 27017;
        this.database = process.env.DB_DATABASE || 'files_manager';
    }
    isAlive() {
        return this.client.isConnected();
    }
    async nbUsers() {
        const collection = this.client.db(this.database).collection('users');
        const result = await collection.countDocuments();
        return result;
    }
    async nbFiles() {
        const collection = this.client.db(this.database).collection('files');
        const result = await collection.countDocuments();
        return result;
    }
}
const dbClient = new DBClient();
export default dbClient;