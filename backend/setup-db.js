/**
 * Database Setup Helper Script
 * This script helps you set up and test your database connection
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkDatabase() {
  console.log('\n=== Database Connection Check ===\n');
  
  const dbName = process.env.DB_NAME || 'db_smartform';
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS || '123123';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 3306;

  console.log('Current configuration:');
  console.log(`  Host: ${dbHost}`);
  console.log(`  Port: ${dbPort}`);
  console.log(`  Database: ${dbName}`);
  console.log(`  User: ${dbUser}`);
  console.log(`  Password: ${dbPass ? '***' : '(not set)'}\n`);

  // First, try to connect to MySQL server (without database)
  const mysqlConnection = new Sequelize('', dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
  });

  try {
    await mysqlConnection.authenticate();
    console.log('✓ MySQL server connection successful\n');
    
    // Check if database exists
    const [results] = await mysqlConnection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMAS WHERE SCHEMA_NAME = '${dbName}'`
    );
    
    if (results.length === 0) {
      console.log(`⚠ Database '${dbName}' does not exist.`);
      const create = await question('Would you like to create it? (y/n): ');
      
      if (create.toLowerCase() === 'y') {
        await mysqlConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✓ Database '${dbName}' created successfully.\n`);
      } else {
        console.log('Please create the database manually and run this script again.\n');
        process.exit(0);
      }
    } else {
      console.log(`✓ Database '${dbName}' exists.\n`);
    }
    
    await mysqlConnection.close();
    
    // Now test the actual database connection
    const sequelize = new Sequelize(dbName, dbUser, dbPass, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false,
    });
    
    await sequelize.authenticate();
    console.log('✓ Database connection test successful!');
    console.log('\nYou can now start the server with: npm start\n');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ Database connection failed:');
    console.error(`  Error: ${error.message}\n`);
    
    if (error.name === 'SequelizeConnectionError' || error.code === 'ECONNREFUSED') {
      console.error('Possible issues:');
      console.error('  1. MySQL server is not running');
      console.error('     → Start MySQL service (Windows: Services, Mac/Linux: sudo service mysql start)');
      console.error('  2. Wrong host or port');
      console.error('     → Check your DB_HOST and DB_PORT in .env file');
      console.error('  3. Firewall blocking connection');
      console.error('     → Check firewall settings\n');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('Possible issues:');
      console.error('  1. Wrong username or password');
      console.error('     → Check your DB_USER and DB_PASS in .env file');
      console.error('  2. User does not have permission');
      console.error('     → Grant permissions: GRANT ALL ON ' + dbName + '.* TO \'' + dbUser + '\'@\'localhost\';\n');
    } else if (error.name === 'SequelizeDatabaseError' && error.message.includes('Unknown database')) {
      console.error('The database does not exist.');
      console.error('Please create it manually or run this script again to create it.\n');
    }
    
    console.error('Please fix the issues above and try again.\n');
    process.exit(1);
  }
}

// Check if .env file exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('⚠ .env file not found!');
  console.log('Creating .env from env.example.txt...\n');
  
  const examplePath = path.join(__dirname, 'env.example.txt');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✓ .env file created. Please update it with your database credentials.\n');
  } else {
    console.log('✗ env.example.txt not found. Please create .env manually.\n');
    process.exit(1);
  }
}

checkDatabase().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

