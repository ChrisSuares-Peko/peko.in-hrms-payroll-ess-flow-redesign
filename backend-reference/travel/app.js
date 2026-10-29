/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express')
const path = require('path')
const compression = require('compression')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const minify = require('express-minify')
const passport = require('passport')
const flash = require('connect-flash')
const csurf = require('csurf')
const errorHandler = require('./middlewares/error')
// const fileUpload = require('express-fileupload');
const cors = require('cors')
const { v4: uuidv4 } = require('uuid');

const {client: redisClient} = require('./utils/cacheDataMethods');
const RedisStore = require('connect-redis').default;
let app = express()

const useragent = require('express-useragent');
const createLog = require('./middlewares/loggerMiddelware')
const logger = require('./utils/logger')
const { subscribeToMessages } = require('./utils/pubsubSubscriber')
app.use(useragent.express());

console.log('Environment: ' + app.get('env'))

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
//csurf middleware
const csrfMiddleware = csurf({
    cookie: true
})

// app.use(fileUpload());

//middleware for access-control-allow-origin
app.use(cors())
// Security
app.use(helmet())
app.use(helmet.hidePoweredBy({
    setTo: 'GO'
}))

// Compression
app.use(compression())
app.use(minify({
    js_match: /\.js$/,
    css_match: /\.css$/,
    cache: path.join(__dirname, 'cache')
}))
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
}))

app.use(bodyParser.json({
    limit: '10000kb'
}))
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.get('/', (req, res) => {
    res.send('Travel service is up and running!!');
});

app.use((req, res, next) => {
    req.LogTraceId = uuidv4();

    const originalJson = res.json.bind(res);
    res.json = (data) => {
        res.loggerMessage = data?.message || res.statusMessage; // Store data globally for the request
        return originalJson(data);
    };
    res.on('finish', () => {
        createLog(req, res);
    });
    next();
});

app.use('/api/v1', require('./routes/API/v1'))

// Initialize PNR release scheduler for airline bookings
const airlineController = require('./controllers/corporate/airline');
if (typeof airlineController.startPNRReleaseScheduler === 'function') {
    airlineController.startPNRReleaseScheduler().catch(error => {
        console.error('Failed to start PNR release scheduler:', error);
    });
}

//Need to add some condition if its staging or production then only run this code
if (process.env.CLOUD_RUN_TIMEOUT_SECONDS) {
    subscribeToMessages();
}


app.use(errorHandler)

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
app.use((err, req, res, next) => {
    logger.error(err, { req });
    return res.status(err.status || 500).json({
        status: err.status || 500,
        message: 'Internal Server Error',
        data: {},
        responseCode: '001',
    });
});

module.exports = app