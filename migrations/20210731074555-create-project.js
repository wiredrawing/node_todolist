// 実行したMigrationコマンド
//  sequelize model:generate --name Project --attributes project_name:string,project_description:text
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      project_name: {
        type: Sequelize.STRING
      },
      project_description: {
        type: Sequelize.TEXT
      },
      // 識別用のタスクコード
      code_number: {
        type: Sequelize.STRING(64),
      },
      is_displayed: {
        type: Sequelize.INTEGER
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "created_at",
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        // スネークケースで対応するため以下のプロパティを追記
        field: "updated_at",
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
        field: "deleted_at",
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};