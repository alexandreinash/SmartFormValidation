const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  // Database name
  process.env.DB_NAME || 'db_smartform',
  // Username
  process.env.DB_USER || 'root',
  // Password
  process.env.DB_PASS || '123123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = { sequelize };


