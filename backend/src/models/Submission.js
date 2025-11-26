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
  },
  {
    tableName: 'submissions',
    timestamps: false,
  }
);

Submission.belongsTo(Form, { foreignKey: 'form_id', as: 'form' });
Submission.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' });

module.exports = Submission;


