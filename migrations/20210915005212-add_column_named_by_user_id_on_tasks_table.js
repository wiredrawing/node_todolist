// sequelize migration:generate --name add_column_named_by_user_id_on_tasks_table
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.addColumn("tasks", "by_user_id", {
      allowNull: true,
      type: Sequelize.BIGINT,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    return queryInterface.removeColumn("tasks", "by_user_id")
  }
};
