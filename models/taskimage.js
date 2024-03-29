'use strict'
// import {Model} from 'sequelize'
import moment from "moment";
import pkg from 'sequelize';
const {Model} = pkg;
export default (sequelize, DataTypes) => {
  class TaskImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      TaskImage.hasOne(models.Image, {
        foreignKey: 'id',
        sourceKey: 'image_id'
      })
      TaskImage.hasOne(models.Task, {
        foreignKey: 'id',
        sourceKey: 'task_id'
      })
    }
  }
  TaskImage.init(
    {
      task_id: DataTypes.BIGINT,
      image_id: DataTypes.BIGINT
    },
    {
      sequelize,
      tableName: 'task_images',
      modelName: 'TaskImage',
      underscored: true
    }
  )
  return TaskImage
}
