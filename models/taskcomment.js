'use strict';
const {
  Model
} = require('sequelize');
const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  class TaskComment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TaskComment.hasOne(models.user, {
        foreignKey: "id",
        sourceKey: "user_id",
      });
    }

    formatted_created_at() {
      return moment(this.created_at).format("Y年M月d日 H時m分s秒");
    }

    formatted_updated_at() {
      return moment(this.updated_at).format("Y年M月d日 H時m分s秒");
    }

  };

  TaskComment.init({
    task_id: DataTypes.BIGINT,
    comment: DataTypes.TEXT,
    user_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'TaskComment',
    tableName: 'task_comments',
    underscored: true,
  });
  return TaskComment;
};