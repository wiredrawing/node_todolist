'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      task.belongsTo(models.user, {
        foreignKey: "id"
      })
      console.dir(task);
    }
  };
  task.init({
    task_name: DataTypes.STRING,
    user_id: DataTypes.BIGINT,
    status: DataTypes.INTEGER,
    createdAt: {
      type: DataTypes.DATE,
      fieldName: "created_at",
      underscored: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      fieldName: "updated_at",
      underscored: true,
    }
  }, {
    sequelize,
    modelName: 'task',
    underscored: true,
  });
  return task;
};