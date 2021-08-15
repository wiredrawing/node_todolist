'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // imagesテーブルとのリレーション
      ProjectImage.hasOne(models.Image, {
        foreignKey: "id",
        sourceKey: "image_id",
      });
      // projectsテーブルとのリレーション
      ProjectImage.hasOne(models.Project, {
        foreignKey: "id",
        sourceKey: "project_id",
      });
    }
  }
  ProjectImage.init(
    {
      project_id: DataTypes.BIGINT,
      image_id: DataTypes.BIGINT,
    },
    {
      sequelize,
      tableName: 'project_images',
      modelName: 'ProjectImage',
      underscored: true,
    }
  );
  return ProjectImage;
};
