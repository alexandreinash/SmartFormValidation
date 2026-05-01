const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

async function indexExists(tableName, indexName) {
  const queryInterface = sequelize.getQueryInterface();
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((index) => index.name === indexName);
}

async function ensureSubmissionGradingColumns(options = {}) {
  const log = typeof options.log === 'function' ? options.log : () => {};
  const queryInterface = sequelize.getQueryInterface();
  const tableDefinition = await queryInterface.describeTable('submissions');

  const columns = [
    {
      name: 'ai_grade_score',
      definition: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      name: 'ai_grade_max_score',
      definition: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      name: 'ai_feedback',
      definition: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      name: 'teacher_grade_score',
      definition: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      name: 'teacher_grade_max_score',
      definition: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
      name: 'teacher_feedback',
      definition: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      name: 'grade_status',
      definition: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending_review' },
    },
    {
      name: 'graded_by',
      definition: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      name: 'graded_at',
      definition: { type: DataTypes.DATE, allowNull: true },
    },
    {
      name: 'published_at',
      definition: { type: DataTypes.DATE, allowNull: true },
    },
  ];

  for (const column of columns) {
    if (tableDefinition[column.name]) {
      log(`Submission column already present: ${column.name}`);
      continue;
    }

    log(`Adding missing submission column: ${column.name}`);
    await queryInterface.addColumn('submissions', column.name, column.definition);
  }

  await sequelize.query("UPDATE submissions SET grade_status = 'pending_review' WHERE grade_status IS NULL OR grade_status = ''");

  const indexes = [
    { name: 'idx_submissions_grade_status', fields: ['grade_status'] },
    { name: 'idx_submissions_published_at', fields: ['published_at'] },
  ];

  for (const index of indexes) {
    if (await indexExists('submissions', index.name)) {
      log(`Submission index already present: ${index.name}`);
      continue;
    }

    log(`Adding submission index: ${index.name}`);
    await queryInterface.addIndex('submissions', index.fields, { name: index.name });
  }
}

module.exports = ensureSubmissionGradingColumns;