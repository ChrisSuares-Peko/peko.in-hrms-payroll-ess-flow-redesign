'use strict';

const APPLICATION_COLUMNS = (Sequelize) => ({
    esignSigningLink: { type: Sequelize.STRING(1000), allowNull: true },
    esignSentAt: { type: Sequelize.DATE, allowNull: true },
    esignSignedAt: { type: Sequelize.DATE, allowNull: true },
    esignFailureReason: { type: Sequelize.STRING(500), allowNull: true },
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

        const agreement = await queryInterface.describeTable('corporateCardAgreements');
        if (!agreement.signedPdfKey) {
            await queryInterface.addColumn('corporateCardAgreements', 'signedPdfKey', {
                type: Sequelize.STRING(500),
                allowNull: true,
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        for (const name of Object.keys(APPLICATION_COLUMNS(Sequelize))) {
            if (application[name]) {
                await queryInterface.removeColumn('corporateCardAdminApplications', name);
            }
        }

        const agreement = await queryInterface.describeTable('corporateCardAgreements');
        if (agreement.signedPdfKey) {
            await queryInterface.removeColumn('corporateCardAgreements', 'signedPdfKey');
        }
    },
};
