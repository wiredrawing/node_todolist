'use strict';
// import {Model} from 'sequelize'
import moment from "moment";
import pkg from 'sequelize';
const {Model} = pkg;
export default (sequelize, DataTypes) => {
  class Star extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Star.hasOne(models.User, {
        foreignKey: "id",
      });
      Star.hasOne(models.Task, {
        foreignKey: "id",
      });
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
  Star.init({
    // usersのid
    task_id: DataTypes.BIGINT,
    // tasksのid
    user_id: DataTypes.BIGINT,
    deletedAt: {
      type: DataTypes.DATE,
      // field: "deleted_at",
    },
    created_at: {
      type: DataTypes.DATE,
      // field: "created_at",
    },
    updated_at: {
      type: DataTypes.DATE,
      // field: "updated_at",
    },
    deleted_at: {
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
