const Sequelize = require("sequelize");
const logger = require("../../utils/logger");

let retries = 0;
const MAX_RETRIES = parseInt(process.env.SEQUELIZE_MAX_RETRIES) || 5;

let sequelizeConfig = {
  logging: process.env.DEBUG === 'true' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  benchmark: true,
  host: process.env.DATABASE_HOST,
  dialect: "mysql",
  timezone: "+05:30",
  pool: {
    max: parseInt(process.env.DATABASE_POOL_MAX, 10) || 20,
    min: 0,
    acquire: 40000,
    idle: 10000
  },
  dialectOptions: {
    charset: "utf8mb4",
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
}

const sequelize = (module.exports = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD, 
  sequelizeConfig
));

const calculateBackoffDelay = (attempt) => {
  const baseDelay = 2000;
  const exponent = 1.5;
  return Math.floor(baseDelay * Math.pow(exponent, attempt - 1));
};

async function authenticateWithRetry() {
  while(retries < MAX_RETRIES){
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
      retries = 0;
      return;
    } catch (error) {
      retries++;
      console.error(`Attempt ${retries}`);

      if (retries >= MAX_RETRIES) {
        logger.error("Max retries reached. Could not establish a database connection.");
      } else {
         const delay = calculateBackoffDelay(retries);
        console.log(`Waiting for ${delay / 1000} seconds before retry ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    }
  }
}

function logPoolStatus() {
  const pool = sequelize.connectionManager.pool;
  console.log(`\n🔍 Sequelize Connection Pool Status:`);
  console.log(`Total Connections: ${pool.size}`);
  console.log(`Used Connections: ${pool.using}`);
  console.log(`Free Connections: ${pool.available}`);
  console.log(`Pending Requests: ${pool.waiting}`);
}

setInterval(logPoolStatus, 300000).unref();

sequelize.beforeQuery((options) => {
  options.startTime = Date.now();
});
 
sequelize.afterQuery((options) => {
  const executionTime = Date.now() - options.startTime;
  if (executionTime > 2000) {
    console.warn(
      `🐢 Slow query detected: ${options.sql} (Execution Time: ${executionTime}ms)`
    );
  }
}); 

authenticateWithRetry();

sequelize.afterConnect(() => {
  console.log("New connection established");
});
 
sequelize.afterDisconnect(() => {
  console.log("Connection closed");
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  logger.error("Something went wrong while connecting database", { err });
   if (err.code === 'ENOTFOUND') {
    console.error("Network issue: Unable to resolve hostname.");
    logger.error("Network issue: Unable to resolve hostname.", { err });
  }
});
