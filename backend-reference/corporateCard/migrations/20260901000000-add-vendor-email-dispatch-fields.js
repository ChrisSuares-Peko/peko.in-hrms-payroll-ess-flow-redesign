'use strict';

const APPLICATION_COLUMNS = (Sequelize) => ({
    vendorEmailStatus: { type: Sequelize.BOOLEAN, allowNull: true },
    vendorEmailSentAt: { type: Sequelize.DATE, allowNull: true },
});

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        const columns = APPLICATION_COLUMNS(Sequelize);
        for (const [name, definition] of Object.entries(columns)) {
            if (!application[name]) {
                await queryInterface.addColumn('corporateCardAdminApplications', name, definition);
            }
        }

        const indexes = await queryInterface.showIndex('corporateCardAdminApplications');
        if (!indexes.some((index) => index.name === 'ccAdminApp_vendorEmailStatus_idx')) {
            await queryInterface.addIndex('corporateCardAdminApplications', ['vendorEmailStatus'], {
                name: 'ccAdminApp_vendorEmailStatus_idx',
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const indexes = await queryInterface.showIndex('corporateCardAdminApplications');
        if (indexes.some((index) => index.name === 'ccAdminApp_vendorEmailStatus_idx')) {
            await queryInterface.removeIndex('corporateCardAdminApplications', 'ccAdminApp_vendorEmailStatus_idx');
        }

        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        for (const name of Object.keys(APPLICATION_COLUMNS(Sequelize))) {
            if (application[name]) {
                await queryInterface.removeColumn('corporateCardAdminApplications', name);
            }
        }
    },
};
