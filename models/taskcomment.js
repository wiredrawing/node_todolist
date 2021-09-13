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
      TaskComment.hasMany(models.CommentImage, {
        foreignKey: "comment_id",
        sourceKey: "id",
      });
    }

    /**
     * 改行済みのコメントを取得する
     *
     */
    get_new_line_comment()
    {
      return this.comment.replace(/\n/g, "<br>");
    }

    // -----------------------------------------------
    // フォーマットされた作成日時および更新日時を設定
    // -----------------------------------------------
    formattedCreatedAt() {
      return moment(this.createdAt).format("Y年M月D日 H時m分s秒");
    }

    formattedUpdatedAt() {
      return moment(this.updatedAt).format("Y年M月D日 H時m分s秒");
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