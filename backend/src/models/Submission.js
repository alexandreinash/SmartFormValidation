const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');
const Form = require('./Form');
const User = require('./User');

const Submission = sequelize.define(
  'Submission',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    form_id: { type: DataTypes.INTEGER, allowNull: false },
    submitted_by: { type: DataTypes.INTEGER, allowNull: true },
    submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ai_grade_score: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ai_grade_max_score: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ai_feedback: { type: DataTypes.TEXT, allowNull: true },
    teacher_grade_score: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    teacher_grade_max_score: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    teacher_feedback: { type: DataTypes.TEXT, allowNull: true },
    grade_status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending_review' },
    graded_by: { type: DataTypes.INTEGER, allowNull: true },
    graded_at: { type: DataTypes.DATE, allowNull: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'submissions',
    timestamps: false,
  }
);

Submission.belongsTo(Form, { foreignKey: 'form_id', as: 'form' });
Submission.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' });

module.exports = Submission;


