const { legacyCreateProxyMiddleware } = require('http-proxy-middleware');

const setupProxies = (app, routes) => {
    routes.forEach(r => {
        app.use(r.url, legacyCreateProxyMiddleware(r.proxy));
    });
}

exports.setupProxies = setupProxies
