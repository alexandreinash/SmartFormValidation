const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  // Database name in MySQL Workbench (schema)
  process.env.DB_NAME || 'db_smartform',
  // Username and password
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '123123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = { sequelize };


