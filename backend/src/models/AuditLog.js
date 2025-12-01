const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');
const User = require('./User');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING, allowNull: true },
    entity_id: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'audit_logs',
    timestamps: false,
  }
);

AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = AuditLog;


