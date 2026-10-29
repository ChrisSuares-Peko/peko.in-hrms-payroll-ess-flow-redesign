const app = require('./app'); 
const connectDb = require('./configs/database/connection');
const gracefulShutdown = require('./utils/serverClose');
const PORT = process.env.PORT || 3000;
let server;

const start = async () => {
    await connectDb();
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => gracefulShutdown(server));
    process.on('SIGTERM', () => gracefulShutdown(server));

    return server; 
};
const stop = async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
};

if (require.main === module) {
    start();
}


module.exports = { start, stop };

