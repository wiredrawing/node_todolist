'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class ProjectUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      ProjectUser.hasOne(models.Project, {
        foreignKey: 'id',
        sourceKey: 'project_id'
      })
      ProjectUser.hasOne(models.user, {
        foreignKey: 'id',
        sourceKey: 'user_id'
      })
    }
  };
  ProjectUser.init({
    user_id: {
      allowNull: false,
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    project_id: {
      allowNull: false,
      type: DataTypes.BIGINT,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'project_users',
    modelName: 'ProjectUser',
    underscored: true
  })
  return ProjectUser
}
