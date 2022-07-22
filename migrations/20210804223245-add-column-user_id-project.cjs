// 既存テーブルのスキーマを変更する
// 実行したコマンド
// sequelize migration:generate --name add-column-user_id-project
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.addColumn("projects", "user_id", {
      allowNull: false,
      type: Sequelize.BIGINT(0),
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.removeColumn("projects", "user_id");
  }
};
