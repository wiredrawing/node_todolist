// --------------------------------------------------------------------------
// 実行したコマンド
// sequelize model:generate --name TaskThread --attributes task_id:bigint,ancestor_id:bigint,descendant_id:bigint
// 上記マイグレーションファイルを実行する場合は
// sequelize db:migrate コマンドを実行する
// --------------------------------------------------------------------------
'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('task_threads', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(255)
      },
      task_id: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      ancestor_id: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      descendant_id: {
        allowNull: false,
        type: Sequelize.BIGINT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      // 削除フラグはnullを許可する
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('task_threads')
  }
}
