'use strict';
const {
  Model, TimeoutError
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
        foreignKey: "user_id",
        sourceKey: "id",
      });
      // starsテーブルに紐づく
      task.hasMany(models.Star, {
        foreignKey: "task_id",
        sourceKey: "id",
      });
      // projectsテーブルに紐づく
      task.belongsTo(models.Project, {
        foreignKey: "project_id",
        sourceKey: "id",
      })
    }
  };
  task.init({
    task_name: DataTypes.STRING,
    user_id: DataTypes.BIGINT,
    task_description: DataTypes.STRING,
    status: DataTypes.INTEGER,
    deletedAt: {
      type: DataTypes.DATE,
      // fieldName: "deleted_at",
      // underscored: true,
    },
    created_at: {
      type: DataTypes.DATE,
      // fieldName: "created_at",
      // underscored: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      // fieldName: "updated_at",
      // underscored: true,
    }
  }, {
    sequelize,
    modelName: 'task',
    // underscored: trueがあるとスネークケースが許可される
    underscored: true,
    paranoid: true,
  });
  return task;
};