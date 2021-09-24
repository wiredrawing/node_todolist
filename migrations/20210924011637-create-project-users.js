'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_users', {
      // usersテーブル
      user_id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      // projectsテーブル
      project_id: {
        type: Sequelize.BIGINT,
        primaryKey: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {
      uniqueKeys: {
        UsersProjectsIndex: {
          fields: [
            'user_id',
            'project_id'
          ],
          primaryKey: true
        }
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('project_users')
  }
}
