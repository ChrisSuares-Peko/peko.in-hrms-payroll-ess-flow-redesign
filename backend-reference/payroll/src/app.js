const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const createLog = require("./middleware/loggerMiddleware");
const logger = require("./utils/logger");
require("./utils/redis");

const app = express();

app.use(cors());
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(require('./middleware/stripMongoOperators'));
app.use(helmet());
app.use(helmet.hidePoweredBy({
    setTo: 'GO'
}));
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
    req.LogTraceId = uuidv4();
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        res.loggerMessage = data?.message || res.statusMessage;
        return originalJson(data);
    };
    res.on('finish', () => {
        createLog(req, res);
    });
    next();
});

app.get("/api/v1/:userType/:userId/payroll/health", (req,res)=>{
    return res.status(200).json({
        status: true,
        message: "Health check passed. The 'payroll' service is running smoothly.",
        data:{},
        responseCode: '000'
    })
})

app.use('/api/v1/corporate/:corporateId/payroll', require('./routes'));
app.use('/api/v1/user/:userId/payroll', require('./routes/user'));
// Gateway strips the /api/v1/payroll/ prefix for this path before forwarding.
app.use('/esign-callback', require('./routes/eSignCallback'));

app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
    return res.status(404).json({
        status: 404,
        message: 'The requested resource was not found on this server.',
        data: {},
        responseCode: '001',
    });
});

// Error Handling Middleware
app.use((err, req, res) => {
    logger.error(err, { req });
    return res.status(err.status || 500).json({
        status: err.status || 500,
        message: 'Internal Server Error',
        data: {},
        responseCode: '001',
    });
});

app.get("/", (req, res) => res.send("payroll service is called"));

module.exports = app;
