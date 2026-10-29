const gracefulShutdown = (server) => {
    console.log('Received termination signal. Closing server connections...');
    if (server) {
        server.close((err) => {
            if (err) {
                console.error('Error closing server:', err);
                process.exit(1);
            }
            console.log('Server connections closed. Exiting...');
            process.exit(0);
        });
    }
};

module.exports = gracefulShutdown;
