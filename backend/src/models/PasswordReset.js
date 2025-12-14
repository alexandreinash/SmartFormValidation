const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PasswordReset = sequelize.define(
  'PasswordReset',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'password_resets',
    timestamps: false,
  }
);

// Define association after User model is loaded
const User = require('./User');
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = PasswordReset;

