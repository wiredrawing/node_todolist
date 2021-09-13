'use strict';
const {
  Model
} = require('sequelize');
const moment = require("moment");
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
    }
    getUserLink() {
      this.userLink = `(${this.id}) ${this.user_name} さんのタスクへ`;
      return this;
    }

    formattedCreatedAt() {
      return moment(this.createdAt).format("Y年M月D日 H時m分s秒");
    }

    formattedUpdatedAt() {
      return moment(this.updatedAt).format("Y年M月D日 H時m分s秒");
    }

  };
  user.init({
    user_name: DataTypes.STRING,
    email: DataTypes.STRING,
    section_type: DataTypes.STRING,
    description: DataTypes.STRING,
    password: DataTypes.STRING,
    deleted_at: {
      type: DataTypes.DATE,
      // fieldName: "deleted_at",
      // underscored: true,
    },
    created_at: {
      type: DataTypes.DATE,
      // fieldName: "created_at",
      // underscored: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      // field: "updated_at",
      // fieldName: "updated_at",
      // underscored: true,
    }
  }, {
    sequelize,
    modelName: 'user',
    underscored: true,
    paranoid: true,
  });
  return user;
};