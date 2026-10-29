
const express = require('express')
const path = require('path')
const compression = require('compression')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const { v4: uuidv4 } = require('uuid');

const cors = require('cors')

const {client: redisClient} = require('./utils/cacheDataMethods');
const RedisStore = require("connect-redis").default

const createLog = require("./middlewares/loggerMiddelware");
const logger = require("./utils/logger");
const {restartAdminSchedulars} = require("./controllers/admin/reportSettings")
const {restartCorporateSchedulars} = require("./controllers/corporate/reportSettings")


let app = express()

const useragent = require('express-useragent');
app.use(useragent.express());

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
    res.send('Scheduler service is up and running!!!');
});

app.get("/api/v1/:userType/:userId/scheduler/health", (req,res)=>{
    return res.status(200).json({
        status: true,
        message: "Health check passed. The 'scheduler' service is running smoothly.",
        data:{},
        responseCode: '000'
    })
})

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


const { scheduleCronTasks } = require('./utils/scheduleReport')

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
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    logger.error(err, { req });
    return res.status(err.status || 500).json({
        status: err.status || 500,
        message: 'Internal Server Error',
        data: {},
        responseCode: '001',
    });
});


//cron taskScheduler
scheduleCronTasks()
restartAdminSchedulars();
restartCorporateSchedulars();


module.exports = app