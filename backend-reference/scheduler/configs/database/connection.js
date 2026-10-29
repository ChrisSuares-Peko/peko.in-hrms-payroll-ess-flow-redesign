const mongoose = require('mongoose');
// const path = require('path');

async function connectDb() {
    try {
        // const dbPem = path.join(process.cwd(), 'src/configs/database', 'server.pem');

        const options = {
            // tls: true,
            // tlsCAFile: dbPem,
        };
         const requiredEnvVars = ['MONGODB_INITIAL', 'MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_URL', 'MONGODB_DB_NAME', 'MONGODB_OPTIONALS'];
        for (const key of requiredEnvVars) {
            if (!process.env[key]) {
                throw new Error(`Missing required environment variable: ${key}`);
            }
        }
        let connectionString = `${process.env.MONGODB_INITIAL}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_DB_NAME}?${process.env.MONGODB_OPTIONALS}`
        await mongoose.connect(connectionString, options);
        console.log('Connected to MongoDB');

        // Gracefully close the MongoDB connection on process termination
        const gracefulExit = () => {
            mongoose.connection.close();
            console.log('MongoDB connection closed');
            process.exit(0);
        };

        // Handle process termination events
        process.on('SIGINT', () => {
            console.log('SIGINT received. Closing MongoDB connection...');
            gracefulExit();
        });

        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Closing MongoDB connection...');
            gracefulExit();
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDb;