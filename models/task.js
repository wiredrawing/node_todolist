'use strict';
const {
  Model, TimeoutError
} = require('sequelize');
const moment = require("moment");
module.exports = (sequelize, DataTypes) => {
  class task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // belongsToで代替可能だが...
      task.hasOne(models.user, {
        foreignKey: "id",
        sourceKey: "user_id",
      });
      // belongsToUserで代替した場合
      // かつ､エイリアスで別名を付与
      task.belongsTo(models.user, {
        foreignKey:"user_id",
        sourceKey: "id",
        as: "belongsToUser",
      });
      // starsテーブルに紐づく
      task.hasMany(models.Star, {
        foreignKey: "task_id",
        sourceKey: "id",
      });
      // projectsテーブルに紐づく
      task.hasOne(models.Project, {
        foreignKey: "id",
        sourceKey: "project_id",
      });
      // 画像とタスクを紐付ける中間テーブルのリレーション
      task.hasMany(models.TaskImage, {
        foreignKey: "task_id",
        sourceKey: "id",
      });
      // タスクに紐づくコメント一覧を取得するリレーション
      task.hasMany(models.TaskComment, {
        foreignKey: "task_id",
        sourceKey: "id",
      });
    }

    formatted_created_at() {
      return moment(this.createdAt).format("Y年M月D日 H時m分s秒");
    }

    formatted_updated_at() {
      return moment(this.updatedAt).format("Y年M月D日 H時m分s秒");
    }

    formattedStartTime() {
      console.log("=============>", moment(this.start_time).format("Y年M月D日"));
      return moment(this.start_time).format("Y年M月D日");
    }

    formattedEndTime() {
      return moment(this.end_time).format("Y年M月D日");
    }
  };
  task.init({
    task_name: DataTypes.STRING,
    user_id: DataTypes.BIGINT,
    task_description: DataTypes.STRING,
    status: DataTypes.INTEGER,
    priority: DataTypes.INTEGER,
    is_displayed: DataTypes.INTEGER,
    code_number: DataTypes.STRING,
    deleted_at: {
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
    },
    deleted_at: {
      type: DataTypes.DATE,
    },
    start_time: {
      type: DataTypes.DATE,
    },
    end_time: {
      type: DataTypes.DATE,
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