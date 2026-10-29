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
const errorHandler = require('./middlewares/error')
const fileUpload = require('express-fileupload');
const cors = require('cors')
const { v4: uuidv4 } = require('uuid');

const {client: redisClient} = require('./utils/cacheDataMethods');
const RedisStore = require('connect-redis').default;

let app = express()

const useragent = require('express-useragent');
const createLog = require("./middlewares/loggerMiddleware");
const logger = require("./utils/logger");
app.use(useragent.express());

// Login the Server Modes.
// eslint-disable-next-line no-undef
console.log('Environment: ' + app.get('env'))

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Nothing here reads req.files; cap multipart parsing so a large upload cannot exhaust memory.
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
}));
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
    res.send('Users service is up and running!!...');
});

// Logging middleware
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

app.use('/', require('./routes/API/v1'))
app.use('/', require('./routes/redirect'))
// routes/sms (POST /rmlSms) is intentionally not mounted: it sent arbitrary SMS to arbitrary numbers.


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