// 実行したコマンド
//  sequelize migration:generate  --name add_column_priority-task
// sequelize db:migrate
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.addColumn("tasks", "priority", {
      allowNull:false,
      type: Sequelize.INTEGER(0),
      defaultValue: 0,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.removeColumn("tasks", "priority");
  }
};
