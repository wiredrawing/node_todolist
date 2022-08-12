'use strict'
// import {Model} from 'sequelize'
import moment from "moment";
import pkg from 'sequelize';
const {Model} = pkg;
export default (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Project.hasMany(models.Task, {
        // tasksテーブルのproject_idに紐付ける
        foreignKey: 'project_id',
        sourceKey: 'id'
      })
      // 責任者ユーザー
      Project.hasOne(models.User, {
        foreignKey: 'id',
        sourceKey: 'user_id'
      })
      Project.hasMany(models.ProjectImage, {
        foreignKey: 'project_id',
        sourceKey: 'id'
      })
      // プロジェクト作成ユーザー
      Project.hasOne(models.User, {
        foreignKey: 'id',
        sourceKey: 'created_by',
        as: 'userCreatedTask'
      })
      // プロジェクト参画ユーザー
      Project.hasMany(models.ProjectUser, {
        foreignKey: "project_id",
        sourceKey : "id"
      })
    }

    formattedCreatedAt () {
      return moment(this.createdAt).format('Y年M月D日 H時m分s秒')
    }

    formattedUpdatedAt () {
      return moment(this.updatedAt).format('Y年M月D日 H時m分s秒')
    }

    formattedStartTime () {
      return moment(this.start_date).format('Y年M月D日 H時m分s秒')
    }

    formattedEndTime () {
      return moment(this.end_date).format('Y年M月D日 H時m分s秒')
    }
  };
  Project.init({
    project_name: DataTypes.STRING,
    project_description: DataTypes.TEXT,
    user_id: DataTypes.BIGINT,
    code_number: DataTypes.STRING,
    is_displayed: DataTypes.INTEGER,
    is_deleted: DataTypes.INTEGER,
    start_date: {
      type: DataTypes.DATE
    },
    end_date: {
      type: DataTypes.DATE
    },
    created_by: {
      type: DataTypes.BIGINT
    }
  }, {
    sequelize,
    modelName: 'Project',
    // テーブル名は小文字のスネークケース複数形のため以下のように追加する
    tableName: 'projects',
    // スネークケースを許可するため以下を追加
    underscored: true
  })
  return Project
}
