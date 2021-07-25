'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.hasMany(models.task, {
        foreignKey: "user_id",
      })
      console.log(user);
    }
  };
  user.init({
    user_name: DataTypes.STRING,
    section_type: DataTypes.STRING,
    deletedAt: {
      type: DataTypes.DATE,
      fieldName: "deleted_at",
      underscored: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      fieldName: "created_at",
      underscored: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      fieldName: "updated_at",
      underscored: true,
    }
  }, {
    sequelize,
    modelName: 'user',
    underscored: true,
    paranoid: true,
  });
  return user;
};