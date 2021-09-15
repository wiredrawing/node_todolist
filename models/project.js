'use strict'
const {
  Model
} = require('sequelize')

const moment = require('moment')

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      Project.hasMany(models.task, {
        // tasksテーブルのproject_idに紐付ける
        foreignKey: 'project_id',
        sourceKey: 'id'
      })
      Project.hasOne(models.user, {
        foreignKey: 'id',
        sourceKey: 'user_id'
      })
      Project.hasMany(models.ProjectImage, {
        foreignKey: 'project_id',
        sourceKey: 'id'
      })
      // define association here
    }

    formattedCreatedAt () {
      return moment(this.createdAt).format('Y年M月D日 H時m分s秒')
    }

    formattedUpdatedAt () {
      return moment(this.updatedAt).format('Y年M月D日 H時m分s秒')
    }

    formattedStartTime () {
      return moment(this.start_time).format('Y年M月D日 H時m分s秒')
    }

    formattedEndTime () {
      return moment(this.end_time).format('Y年M月D日 H時m分s秒')
    }
  };
  Project.init({
    project_name: DataTypes.STRING,
    project_description: DataTypes.TEXT,
    user_id: DataTypes.BIGINT,
    code_number: DataTypes.STRING,
    is_displayed: DataTypes.INTEGER,
    start_time: {
      type: DataTypes.DATE
    },
    end_time: {
      type: DataTypes.DATE
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
