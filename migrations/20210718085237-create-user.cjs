// マイグレーションの実行コマンド
// => npx sequelize db:migrate (※ Laravelでの php artisan migrate)
// 一度にすべてのテーブルを削除する場合
// npx sequelize db:migrate:undo:all (※ Laravelでの php artisan migrate:rollback)
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      // ユーザー名
      user_name: {
        type: Sequelize.STRING(512),
      },
      // 担当部署
      section_type: {
        type: Sequelize.INTEGER
      },
      // ログインID
      email: {
        type: Sequelize.STRING(512),
      },
      // 自己紹介
      description: {
        type: Sequelize.STRING(2048),
      },
      // 表示状態
      is_displayed: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      // 削除状態
      is_deleted: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      password: {
        type: Sequelize.STRING(2048),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "created_at",
        fieldName: "created_at",
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "updated_at",
        fieldName: "updated_at",
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
        field: "deleted_at",
        fieldName: "deleted_at",
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
