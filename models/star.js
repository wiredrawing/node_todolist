'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Star extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Star.hasOne(models.user, {
        foreignKey: "id",
      });
      Star.hasOne(models.task, {
        foreignKey: "id",
      });
    }

    formatted_created_at() {
      return moment(this.created_at).format("Y年M月d日 H時m分s秒");
    }

    formatted_updated_at() {
      return moment(this.updated_at).format("Y年M月d日 H時m分s秒");
    }
  };
  Star.init({
    // usersのid
    task_id: DataTypes.BIGINT,
    // tasksのid
    user_id: DataTypes.BIGINT,
    deletedAt: {
      type: DataTypes.DATE,
      // field: "deleted_at",
    },
    createdAt: {
      type: DataTypes.DATE,
      // field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      // field: "updated_at",
    },
  }, {
    sequelize,
    modelName: 'Star',
    tableName: 'stars',
    // カラムのアンダースコア区切りを許可する場合は以下を指定する
    underscored: true,
  });
  return Star;
};