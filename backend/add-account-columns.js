require('dotenv').config();
const { sequelize } = require('./src/sequelize');
const { QueryTypes } = require('sequelize');

async function addAccountColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if account_id column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'account_id'
    `);

    if (results.length === 0) {
      console.log('Adding account_id column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN account_id INT NULL AFTER role
      `);
      console.log('✓ Added account_id column');
    } else {
      console.log('✓ account_id column already exists');
    }

    // Check if is_account_owner column exists
    const [results2] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'is_account_owner'
    `);

    if (results2.length === 0) {
      console.log('Adding is_account_owner column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN is_account_owner BOOLEAN DEFAULT FALSE AFTER account_id
      `);
      console.log('✓ Added is_account_owner column');
    } else {
      console.log('✓ is_account_owner column already exists');
    }

    // Add index if it doesn't exist
    console.log('Adding index on account_id...');
    try {
      await sequelize.query(`
        CREATE INDEX idx_account_id ON users(account_id)
      `);
      console.log('✓ Added index on account_id');
    } catch (err) {
      if (err.message.includes('Duplicate key name')) {
        console.log('✓ Index on account_id already exists');
      } else {
        throw err;
      }
    }

    // Add foreign key constraint if it doesn't exist
    console.log('Adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_ibfk_account 
        FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key constraint');
    } catch (err) {
      if (err.message.includes('Duplicate key name') || err.message.includes('already exists')) {
        console.log('✓ Foreign key constraint already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addAccountColumns();

