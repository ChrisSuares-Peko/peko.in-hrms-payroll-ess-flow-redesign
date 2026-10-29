require('dotenv').config()
const express = require('express')
const path = require('path')
const compression = require('compression')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const logger = require('../utils/logger')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const cors = require('cors')

const redis = require("redis");
const RedisStore = require("connect-redis").default


let app = express()

const useragent = require('express-useragent');
app.use(useragent.express());

console.log('Environment: ' + app.get('env'))

const redisClient = redis.createClient({
    host: process.env.REDIS_HOSTNAME,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});


//middleware for access-control-allow-origin
app.use(cors())
// Security
app.use(helmet())
app.use(helmet.hidePoweredBy({
    setTo: 'GO'
}))

// Compression
app.use(compression())

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}))


app.use(bodyParser.json({
    limit: '27341kb',  // 20 mb +33% buffer boz size increasing while base64 encoding
    // 'application/*+json' supports various JSON-based content types (e.g., cloudevents+json) often used in stitch webhooks
    type: ['application/json', 'application/*+json']
}));
app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'REDACTED',
    resave: false,
    saveUninitialized: false
}));

app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())


app.get('/', (req, res) => {
    res.send('Corporate Services service is up and running!!');
});

app.get("/api/v1/:userType/:userId/corporateServices/health", (req, res) => {
    return res.status(200).json({
        status: true,
        message: "Health check passed. The 'corporateServices' service is running smoothly.",
        data: {},
        responseCode: '000'
    })
})

// app.use((req, res, next) => {
//     req.LogTraceId = uuidv4();

//     const originalJson = res.json.bind(res);
//     res.json = (data) => {
//         res.loggerMessage = data?.message || res.statusMessage; // Store data globally for the request
//         return originalJson(data);
//     };
//     res.on('finish', () => {
//         createLog(req, res);
//     });
//     next();
// });

app.use('/api/v1', require('./routes'))


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

module.exports = app