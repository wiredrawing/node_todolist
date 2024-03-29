'use strict';
// import {Model} from 'sequelize'
import moment from "moment";
import pkg from 'sequelize';
const {Model} = pkg;
export default (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    getImagePath()
    {
      return moment(this.created_at).format("Y/M/D/H");
    }

    getShowImageUrl() {
      return "/api/image/show/" + this.id;
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
  }
  Image.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      file_name: DataTypes.STRING,
      user_id: DataTypes.BIGINT,
      mimetype: DataTypes.STRING(256),
    },
    {
      sequelize,
      tableName: 'images',
      modelName: 'Image',
      // スネークケースを許可するため以下を追加
      underscored: true,
      paranoid: true,
    }
  );
  return Image;
};
