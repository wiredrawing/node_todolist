'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
      // プライマリキー
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      // 作業名
      task_name: {
        type: Sequelize.STRING(512)
      },
      // タスク担当者
      user_id: {
        type: Sequelize.BIGINT
      },
      // 進捗度合い
      status: {
        type: Sequelize.INTEGER(8),
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
  }
};