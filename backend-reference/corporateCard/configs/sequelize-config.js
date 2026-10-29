
const dialectOptions = {
  charset: 'utf8mb4',
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
};

module.exports = {
  [process.env.NODE_ENV || 'development']: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    dialectOptions,
  }
};
