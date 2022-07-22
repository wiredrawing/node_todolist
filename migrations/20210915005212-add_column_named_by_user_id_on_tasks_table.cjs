// sequelize migration:generate --name add_column_named_created_by_on_tasks_table
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.addColumn("tasks", "created_by", {
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

    return queryInterface.removeColumn("tasks", "created_by")
  }
};
