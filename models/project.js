'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Project.hasMany(models.task, {
        // tasksテーブルのproject_idに紐付ける
        foreignKey: "project_id",
        sourceKey: "id",
      });
      // define association here
    }
  };
  Project.init({
    project_name: DataTypes.STRING,
    project_description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Project',
    // テーブル名は小文字のスネークケース複数形のため以下のように追加する
    tableName: 'projects',
    // スネークケースを許可するため以下を追加
    underscored: true,
  });
  return Project;
};