require('dotenv').config();
const { sequelize } = require('./src/sequelize');
const { QueryTypes } = require('sequelize');

async function addAccountIdToForms() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if account_id column exists in forms table
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'forms' 
      AND COLUMN_NAME = 'account_id'
    `);

    if (results.length === 0) {
      console.log('Adding account_id column to forms table...');
      await sequelize.query(`
        ALTER TABLE forms 
        ADD COLUMN account_id INT NULL AFTER created_by
      `);
      console.log('✓ Added account_id column to forms table');
      
      // Add index on account_id
      console.log('Adding index on account_id...');
      try {
        await sequelize.query(`
          CREATE INDEX idx_forms_account_id ON forms(account_id)
        `);
        console.log('✓ Added index on account_id');
      } catch (err) {
        if (err.message.includes('Duplicate key name')) {
          console.log('✓ Index on account_id already exists');
        } else {
          throw err;
        }
      }

      // Add foreign key constraint
      console.log('Adding foreign key constraint...');
      try {
        await sequelize.query(`
          ALTER TABLE forms 
          ADD CONSTRAINT forms_ibfk_account 
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
    } else {
      console.log('✓ account_id column already exists in forms table');
    }

    console.log('\n✅ Migration completed successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

addAccountIdToForms();

