require('dotenv').config();
const { sequelize } = require('./src/sequelize');
const ensureSubmissionGradingColumns = require('./src/startup/ensureSubmissionGradingColumns');

async function addSubmissionGradingColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    await ensureSubmissionGradingColumns({ log: console.log });

    console.log('\n✅ Submission grading migration completed successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Submission grading migration failed:', error);
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

addSubmissionGradingColumns();