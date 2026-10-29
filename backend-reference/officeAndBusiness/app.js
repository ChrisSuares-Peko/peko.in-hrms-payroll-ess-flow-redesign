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
const errorHandler = require('./middlewares/error')
// const fileUpload = require('express-fileupload');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors')
const logger = require("./utils/logger");


const {client: redisClient} = require('./utils/cacheDataMethods');
const RedisStore = require("connect-redis").default

let app = express()

const useragent = require('express-useragent');
app.use(useragent.express());

// Login the Server Modes.
console.log('Environment: ' + app.get('env'))

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

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
    limit: '27341kb',  // 20 mb +33% buffer boz size increasing while base64 encoding
    verify: (req, _res, buf) => {
        req.rawBody = buf; // preserved for webhook HMAC signature validation
    }
}));
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.get('/', (req, res) => {
    res.send('OfficeAndBusiness service is up and running!!');
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
app.use('/', require('./routes/API/v1/quotationRoutes'))
app.use('/', require('./routes/redirect'))

app.use(errorHandler)

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

const { BPOSReportScheduler } = require('./utils/BposScheduler')
const createLog = require('./middlewares/loggerMiddelware')
const initNIC = require('./utils/seedNic')
const connectMongo = require('./configs/database/mongo')
const { globalBusinessSetupSubscriber } = require('./utils/pubsub/globalBusinessSetupSubscriber')
//cron taskScheduler
BPOSReportScheduler()

// MongoDB connection (runs alongside Sequelize/MySQL). Required by services
// like globalBusinessSetup that cache vendor data in Mongo collections.
connectMongo().catch(err => {
    logger.error("MongoDB connect failed:", { err });
});

// Pub/Sub subscriber for Global Business Setup events from paymentGateway
// (payment_paid / renewal_approved). Mirrors AE's Azure Service Bus
// `pekoStartEventReceiver` invocation.
try {
    globalBusinessSetupSubscriber();
} catch (err) {
    logger.error("globalBusinessSetupSubscriber init failed:", { err });
}

// initNIC().catch(err => {
//     console.error("NIC init failed:", err);
// });

module.exports = app