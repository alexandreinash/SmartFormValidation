const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');
const Form = require('./Form');
const User = require('./User');

const FormPermission = sequelize.define(
  'FormPermission',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    form_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    account_id: { type: DataTypes.INTEGER, allowNull: true },
    permission_type: { type: DataTypes.ENUM('view', 'edit', 'admin'), allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'form_permissions',
    timestamps: false,
  }
);

FormPermission.belongsTo(Form, { foreignKey: 'form_id', as: 'form' });
FormPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
FormPermission.belongsTo(User, { foreignKey: 'account_id', as: 'accountOwner' });

module.exports = FormPermission;
