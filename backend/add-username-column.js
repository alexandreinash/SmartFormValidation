/**
 * Migration script to add username column to users table
 * This fixes the registration issue
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '123123',
  database: process.env.DB_NAME || 'db_smartform',
  multipleStatements: true
};

async function addUsernameColumn() {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('✅ Connected to database');
    console.log('🔍 Checking if username column exists...');
    
    // Check if column exists
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'username'`,
      [DB_CONFIG.database]
    );
    
    if (columns.length > 0) {
      console.log('✅ Username column already exists');
      
      // Check if it's nullable
      const [columnInfo] = await connection.execute(
        `SELECT IS_NULLABLE 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'username'`,
        [DB_CONFIG.database]
      );
      
      if (columnInfo[0].IS_NULLABLE === 'YES') {
        console.log('🔧 Making username column NOT NULL...');
        await connection.execute(
          `ALTER TABLE users MODIFY COLUMN username VARCHAR(255) NOT NULL`
        );
        console.log('✅ Username column is now NOT NULL');
      }
    } else {
      console.log('➕ Adding username column...');
      await connection.execute(
        `ALTER TABLE users ADD COLUMN username VARCHAR(255) NOT NULL AFTER id`
      );
      console.log('✅ Username column added successfully');
    }
    
    // Update existing users without username
    console.log('🔄 Updating existing users without username...');
    const [result] = await connection.execute(
      `UPDATE users 
       SET username = CONCAT(SUBSTRING_INDEX(email, '@', 1), '_', FLOOR(RAND() * 1000000))
       WHERE username IS NULL OR username = '' OR username = '0'`
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Updated ${result.affectedRows} existing user(s) with generated usernames`);
    } else {
      console.log('✅ All users already have usernames');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now register new users.');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists, skipping...');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to database. Please check:');
      console.error('   1. MySQL server is running');
      console.error('   2. Database credentials in .env file are correct');
      console.error('   3. Database exists');
    } else {
      console.error('❌ Full error:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
addUsernameColumn();

