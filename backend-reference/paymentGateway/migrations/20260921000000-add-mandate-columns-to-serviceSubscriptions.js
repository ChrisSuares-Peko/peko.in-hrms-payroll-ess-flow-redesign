const COLUMNS = (Sequelize) => ({
  vendorSubscriptionId: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
  isGracePeriod: { type: Sequelize.BOOLEAN, defaultValue: false },
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let tableDescription;
    try {
      tableDescription = await queryInterface.describeTable('serviceSubscriptions');
    } catch {
      return; // table does not exist — nothing to migrate
    }
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!tableDescription[name]) {
        await queryInterface.addColumn('serviceSubscriptions', name, definition);
      }
    }
    if (!tableDescription.isGracePeriod) {
      await queryInterface.addIndex('serviceSubscriptions', ['isGracePeriod'], {
        name: 'idx_serviceSubs_isGracePeriod',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    let tableDescription;
    try {
      tableDescription = await queryInterface.describeTable('serviceSubscriptions');
    } catch {
      return;
    }
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (tableDescription[name]) {
        await queryInterface.removeColumn('serviceSubscriptions', name);
      }
    }
  },
};
