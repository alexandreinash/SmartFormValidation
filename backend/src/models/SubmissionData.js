const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');
const Submission = require('./Submission');
const FormField = require('./FormField');

const SubmissionData = sequelize.define(
  'SubmissionData',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    submission_id: { type: DataTypes.INTEGER, allowNull: false },
    field_id: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.TEXT, allowNull: false },
    ai_sentiment_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
    ai_entity_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
    // True when AI validation could not be performed (e.g., Google NLP failure)
    ai_not_evaluated: { type: DataTypes.BOOLEAN, defaultValue: false },
    // JSON array storing all AI-detected errors with corrections: [{type: string, issue: string, correction: string, severity: string}]
    ai_errors: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'submission_data',
    timestamps: false,
  }
);

SubmissionData.belongsTo(Submission, {
  foreignKey: 'submission_id',
  as: 'submission',
});
Submission.hasMany(SubmissionData, {
  foreignKey: 'submission_id',
  as: 'answers',
});
SubmissionData.belongsTo(FormField, {
  foreignKey: 'field_id',
  as: 'field',
});

module.exports = SubmissionData;


