const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const FormField = sequelize.define(
  'FormField',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    form_id: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM('text', 'email', 'number', 'textarea'),
      allowNull: false,
    },
    is_required: { type: DataTypes.BOOLEAN, defaultValue: false },
    ai_validation_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    expected_entity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'none',
    },
    expected_sentiment: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'any',
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'form_fields',
    timestamps: false,
  }
);

// Associations to Form are defined in Form model to avoid circular require issues.

module.exports = FormField;


