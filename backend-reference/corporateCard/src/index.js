const app = require('./app');
const PORT = process.env.PORT || 3000;
let server;

const start = async () => {

    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

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

