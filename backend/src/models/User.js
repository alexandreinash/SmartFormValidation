const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false },
    account_id: { type: DataTypes.INTEGER, allowNull: true },
    is_account_owner: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
);

// Self-referential association for account_id
User.hasMany(User, { foreignKey: 'account_id', as: 'accountMembers' });
User.belongsTo(User, { foreignKey: 'account_id', as: 'account' });

module.exports = User;


