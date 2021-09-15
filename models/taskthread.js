'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class TaskThread extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here

      // ------------------------------------
      // TaskThreadはtaskモデルに属する.
      // ------------------------------------
      TaskThread.belongsTo(models.task, {
        foreignKey: 'task_id',
        sourceKey: 'id'
      })
    }
  };
  TaskThread.init({
    task_id: DataTypes.BIGINT,
    ancestor_id: DataTypes.BIGINT,
    descendant_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'TaskThread',
    // model名とDBの物理テーブル名が異なる場合は､tableNameを明記する
    tableName: 'task_threads',
    // createdAt,updatedAt,deletedAtをアンダースコア形式にする場合は以下を追加
    underscored: true
  })
  return TaskThread
}
