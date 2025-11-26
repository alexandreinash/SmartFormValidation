const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');
const User = require('./User');

const Form = sequelize.define(
  'Form',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'forms',
    timestamps: false,
  }
);

Form.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
// A form has many fields (for eager loading via include: { as: 'fields' })
Form.hasMany(require('./FormField'), {
  foreignKey: 'form_id',
  as: 'fields',
});

module.exports = Form;


