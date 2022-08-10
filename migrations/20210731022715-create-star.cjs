///////////////////////////////////////////////////////////////////////
// Migrationファイルの作成コマンド
// (1)sequelize model:generate --name Star --attributes task_id:bigInt,user_id:bigInt
// 作成したMigrationファイルを実行する
// (2)sequelize db:migrate (※ Laravelでの <php artisan migrate>
// Migrationをロールバック
// (3)sequelize db:migrate:undo
///////////////////////////////////////////////////////////////////////
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      task_id: {
        type: Sequelize.BIGINT
      },
      user_id: {
        type: Sequelize.BIGINT
      },
      createdAt: {
        // スネークケースで対応したいので､fieldプロパティを付与
        field: "created_at",
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        field: "updated_at",
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        field: "deleted_at",
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stars');
  }
};
