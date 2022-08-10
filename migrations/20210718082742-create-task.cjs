// マイグレーションの実行コマンド
// => npx sequelize db:migrate (※ Laravelでの php artisan migrate)
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
      // タスク概要説明
      task_description: {
        type: Sequelize.TEXT
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
      // 表示状態のフラグ
      is_displayed: {
        type: Sequelize.INTEGER(2),
      },
      // 削除状態のフラグ
      is_deleted: {
        type: Sequelize.INTEGER(2),
      },
      // 識別用のタスクコード
      code_number: {
        type: Sequelize.STRING(64),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tasks');
  }
};
