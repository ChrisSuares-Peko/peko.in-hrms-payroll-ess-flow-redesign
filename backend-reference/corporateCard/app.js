/* eslint-disable no-unused-vars */
const express = require('express')
const path = require('path')
const compression = require('compression')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const useragent = require('express-useragent')

const errorHandler = require('./middlewares/error')
const createLog = require('./middlewares/loggerMiddelware')
const { client: redisClient } = require('./utils/cacheDataMethods')
const RedisStore = require('connect-redis').default

const app = express()

app.use(useragent.express())

console.log('Environment: ' + app.get('env'))

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(cors())
app.use(helmet())
app.use(helmet.hidePoweredBy({ setTo: 'GO' }))
app.use(compression())
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }))

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

app.use((req, res, next) => {
    req.LogTraceId = uuidv4()
    const originalJson = res.json.bind(res)
    res.json = (data) => {
        res.loggerMessage = data?.message || res.statusMessage
        return originalJson(data)
    }
    res.on('finish', () => {
        createLog(req, res)
    })
    next()
})

app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.get('/', (req, res) => {
    res.send('Corporate Cards service is up and running!!')
})

app.use('/api/v1', require('./routes/API/v1'))

app.use(errorHandler)

app.use((req, res) => {
    return res.status(404).json({
        status: 404,
        message: 'The requested resource was not found on this server.',
        data: {},
        responseCode: '001',
    })
})

app.use((err, req, res, next) => {
    console.log('🚀 ~ app.use ~ err:', err)
    return res.status(err.status || 500).json({
        status: err.status || 500,
        message: 'Internal Server Error',
        data: {},
        responseCode: '001',
    })
})

module.exports = app
