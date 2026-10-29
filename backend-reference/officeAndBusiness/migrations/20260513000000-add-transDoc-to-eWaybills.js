'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('eWaybills');
    if (!tableExists) return;

    const tableDesc = await queryInterface.describeTable('eWaybills');

    if (!tableDesc.transDocNo) {
      await queryInterface.addColumn('eWaybills', 'transDocNo', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
    if (!tableDesc.transDocDt) {
      await queryInterface.addColumn('eWaybills', 'transDocDt', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const tableExists = await queryInterface.tableExists('eWaybills');
    if (!tableExists) return;

    const tableDesc = await queryInterface.describeTable('eWaybills');
    if (tableDesc.transDocNo) await queryInterface.removeColumn('eWaybills', 'transDocNo');
    if (tableDesc.transDocDt) await queryInterface.removeColumn('eWaybills', 'transDocDt');
  },
};
