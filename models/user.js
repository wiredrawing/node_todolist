'use strict'
// import {Model} from 'sequelize'
import moment from "moment";
import pkg from 'sequelize';
const {Model} = pkg;

export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      User.hasMany(models.Task, {
        foreignKey: 'user_id'
      });

      User.hasMany(models.ProjectUser, {
        foreignKey: "user_id",
        sourceKey: "id",
      })
    }

    getUserLink () {
      this.userLink = `(${this.id}) ${this.user_name} さんのタスクへ`
      return this
    }

    formattedCreatedAt () {
      return moment(this.createdAt).format('Y年M月D日 H時m分s秒')
    }

    formattedUpdatedAt () {
      return moment(this.updatedAt).format('Y年M月D日 H時m分s秒')
    }
  }
  User.init(
    {
      user_name: DataTypes.STRING,
      email: DataTypes.STRING,
      section_type: DataTypes.STRING,
      description: DataTypes.STRING,
      password: DataTypes.STRING,
      deleted_at: {
        type: DataTypes.DATE
        // fieldName: "deleted_at",
        // underscored: true,
      },
      created_at: {
        type: DataTypes.DATE
        // fieldName: "created_at",
        // underscored: true,
      },
      updated_at: {
        type: DataTypes.DATE
        // field: "updated_at",
        // fieldName: "updated_at",
        // underscored: true,
      }
    },
    {
      sequelize,
      modelName: 'User',
      underscored: true,
      paranoid: true
    }
  )
  return User
}
