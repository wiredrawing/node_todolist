'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // タスク内容が紐づく､projectsテーブルのレコード
    return queryInterface.addColumn("tasks", "project_id", {
      allowNull: true,
      type: Sequelize.BIGINT(0)
    })
  },

  down: async (queryInterface, Sequelize) => {
    // ロールバック時の動作を定義
    return queryInterface.removeColumn("tasks", "project_id");
  }
};
