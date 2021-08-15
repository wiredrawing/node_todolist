'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    getShowImageUrl() {
      return "/api/image/show/" + this.id;
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
