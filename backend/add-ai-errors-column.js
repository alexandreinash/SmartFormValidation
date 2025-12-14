const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'db_smartform';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '123123';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: console.log,
});

async function addAiErrorsColumn() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection successful\n');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbName}' 
      AND TABLE_NAME = 'submission_data' 
      AND COLUMN_NAME = 'ai_errors'
    `);

    if (results.length > 0) {
      console.log('✓ Column "ai_errors" already exists in submission_data table');
      await sequelize.close();
      process.exit(0);
    }

    // Add the column
    await sequelize.query(`
      ALTER TABLE \`submission_data\` 
      ADD COLUMN \`ai_errors\` TEXT NULL 
      AFTER \`ai_not_evaluated\`
    `);

    console.log('✓ Successfully added "ai_errors" column to submission_data table');
    console.log('\nThe AI comprehensive validation system is now ready to use!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error adding ai_errors column:');
    console.error(error.message);
    
    if (error.original) {
      console.error('SQL Error:', error.original.message);
    }
    
    await sequelize.close();
    process.exit(1);
  }
}

addAiErrorsColumn();


