const mongoose = require('mongoose');
const { customLog } = require('../../utils/loggerHelper');

// MongoDB connection for officeAndBusiness. Runs side-by-side with the
// Sequelize/MySQL connection (configs/database/index.js). Only services that
// explicitly need document/cache storage (e.g. globalBusinessSetup) use this.
//
// Resolution order (independent of NODE_ENV — any env that has these set uses them):
//   1. MONGODB_URI — single connection string (preferred for local dev)
//   2. Split env vars (MONGODB_INITIAL/USERNAME/PASSWORD/URL/DB_NAME/OPTIONALS)
//      — matches payroll/scheduler convention; works on staging + prod
//   3. Localhost default — ONLY when nothing is configured AND NODE_ENV !== 'production'.
//      Convenience for local dev where Mongo runs without env wiring.
//
// Failure behaviour:
//   - production: process.exit(1) on misconfig or connection failure (Cloud Run restarts)
//   - non-prod: warn + continue (devs working on non-GBS features can still boot)

const isProduction = process.env.NODE_ENV === 'production';
const LOCAL_DEFAULT_URI = 'mongodb://127.0.0.1:27017/peko';

const splitVars = [
    'MONGODB_INITIAL',
    'MONGODB_USERNAME',
    'MONGODB_PASSWORD',
    'MONGODB_URL',
    'MONGODB_DB_NAME',
    'MONGODB_OPTIONALS',
];

// Redact credentials so the connection target is safe to log.
const maskConnectionString = (uri) => {
    try {
        return String(uri).replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
    } catch {
        return '<unparseable>';
    }
};

const resolveConnectionString = () => {
    // 1. URI takes precedence in any environment.
    if (process.env.MONGODB_URI) {
        customLog(null, 'info', { message: '[mongo] Config source: MONGODB_URI (overrides split vars)' });
        return process.env.MONGODB_URI;
    }

    // 2. Split vars — use them whenever all six are present, regardless of
    //    NODE_ENV. This is what staging + production Cloud Run deploys use,
    //    matching payroll/scheduler.
    const missing = splitVars.filter((k) => !process.env[k]);
    if (missing.length === 0) {
        customLog(null, 'info', { message: '[mongo] Config source: split env vars (all 6 present)' });
        return `${process.env.MONGODB_INITIAL}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_DB_NAME}?${process.env.MONGODB_OPTIONALS}`;
    }

    // 3. Nothing configured. Local-dev convenience only; on prod we must fail.
    customLog(null, 'error', {
        message: '[mongo] Config source: NONE — required env vars missing',
        missing,
        fallback: isProduction ? 'none (production requires them)' : LOCAL_DEFAULT_URI,
    });
    if (isProduction) {
        throw new Error(
            `MongoDB connection misconfigured for production. Set MONGODB_URI, or all of: ${splitVars.join(', ')}. Missing: ${missing.join(', ')}`
        );
    }
    return LOCAL_DEFAULT_URI;
};

const connectMongo = async () => {
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    customLog(null, 'info', { message: '[mongo] Initiating MongoDB connection service...' });

    let connectionString;
    try {
        connectionString = resolveConnectionString();
    } catch (cfgErr) {
        if (isProduction) {
            console.error('Critical Error: MongoDB misconfigured:', cfgErr.message);
            process.exit(1);
        }
        customLog(null, 'error', { message: '[mongo] Skipping connection in non-prod env', error: cfgErr.message });
        return null;
    }

    customLog(null, 'info', {
        message: '[mongo] Connecting',
        target: maskConnectionString(connectionString),
        nodeEnv: process.env.NODE_ENV || 'unset',
    });

    // Lifecycle diagnostics — a connection that succeeds at boot but drops
    // later also surfaces as request-time buffering timeouts.
    mongoose.connection.on('error', (err) => {
        customLog(null, 'error', { message: '[mongo] Connection error event', error: err?.message || String(err) });
    });
    mongoose.connection.on('disconnected', () => {
        customLog(null, 'error', { message: '[mongo] DISCONNECTED — GBS cache endpoints will fail until reconnect' });
    });
    mongoose.connection.on('reconnected', () => {
        customLog(null, 'info', { message: '[mongo] Reconnected' });
    });

    try {
        await mongoose.connect(connectionString, {
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 45000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
        });
        customLog(null, 'info', { message: '[mongo] Successfully connected to MongoDB' });
        return mongoose.connection;
    } catch (error) {
        if (isProduction) {
            console.error('Critical Error: Could not connect to MongoDB:', error);
            process.exit(1);
        }
        customLog(null, 'error', {
            message: '[mongo] CONNECTION FAILED — continuing without Mongo; GBS cache endpoints (pending/ongoing/renewals listings) will buffer and time out at request time',
            target: maskConnectionString(connectionString),
            error: error?.message || String(error),
            reason: error?.reason ? String(error.reason) : undefined,
        });
        return null;
    }
};

const gracefulExit = async (signal) => {
    console.log(`${signal} received. Closing MongoDB connection...`);

    const forceQuitTimeout = setTimeout(() => {
        console.error('Forcefully shutting down: MongoDB close took too long.');
        process.exit(1);
    }, 5000);

    try {
        if (mongoose.connection.readyState >= 1) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed gracefully.');
        }
        clearTimeout(forceQuitTimeout);
        process.exit(0);
    } catch (err) {
        console.error('Error during MongoDB graceful close:', err);
        process.exit(1);
    }
};

process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));

module.exports = connectMongo;
