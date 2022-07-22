// スキーマ修正用マイグレーションファイルの作成コマンド
// sequelize migration:generate --name add_column_named_created_by_on_projects
// マイグレーション実行コマンド
// sequelize db:migrate
'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    return queryInterface.addColumn('projects', 'created_by', {
      allowNull: true,
      type: Sequelize.BIGINT,
      defaultValue: null
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.removeColumn('projects', 'created_by')
  }
}
