const mongoose = require('mongoose');

/**
 * DATABASE CONFIGURATION & LIFECYCLE
 * Optimized for Cloud Run Performance & Data Integrity
 */

// Validate required DB env vars before constructing the connection string
const requiredEnvVars = ['MONGODB_INITIAL', 'MONGODB_USERNAME', 'MONGODB_PASSWORD', 'MONGODB_URL', 'MONGODB_DB_NAME', 'MONGODB_OPTIONALS'];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

// Constructing the connection string from environment variables
const connectionString = `${process.env.MONGODB_INITIAL}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_DB_NAME}?${process.env.MONGODB_OPTIONALS}`;

/**
 * Singleton connection function
 * Ensures we reuse the same connection pool across the Cloud Run instance lifetime.
 */
const connectDb = async () => {
    // Return early if already connected to prevent overhead
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    console.log('Initiating MongoDB connection service...');

    try {
        await mongoose.connect(connectionString, {
            // Performance Tuning
            maxPoolSize: 10,             // Sufficient for most Cloud Run concurrency settings
            minPoolSize: 2,              // Keeps a small number of connections active
            maxIdleTimeMS: 45000,        // Closes sockets if the container is "frozen" by GCP
            
            // Reliability Tuning
            serverSelectionTimeoutMS: 5000, // Fail fast if the DB is unreachable
            socketTimeoutMS: 45000,         // Time to wait for operations before timing out
            heartbeatFrequencyMS: 10000,    // Frequently check if the DB is still there
        });

        console.log('Successfully connected to MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.error('Critical Error: Could not connect to MongoDB:', error);
        // In Cloud Run, it's safer to crash and let the orchestrator restart the container
        process.exit(1);
    }
};

/**
 * GRACEFUL SHUTDOWN LOGIC
 * Handles SIGTERM (GCP scaling/deploys) and SIGINT (Local dev)
 */
const gracefulExit = async (signal) => {
    console.log(`${signal} received. Closing MongoDB connection...`);
    
    // Set a safety timeout so the process doesn't hang if the DB is unresponsive
    const forceQuitTimeout = setTimeout(() => {
        console.error('Forcefully shutting down: MongoDB close took too long.');
        process.exit(1);
    }, 5000);

    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed gracefully.');
        clearTimeout(forceQuitTimeout);
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB graceful close:', err);
        process.exit(1);
    }
};

// Listen for termination signals from the GCP environment
process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));

module.exports = connectDb;