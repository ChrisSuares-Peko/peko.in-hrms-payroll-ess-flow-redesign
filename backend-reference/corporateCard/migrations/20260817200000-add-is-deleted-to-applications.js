'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        if (!application.isDeleted) {
            await queryInterface.addColumn('corporateCardAdminApplications', 'isDeleted', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }

        const closure = await queryInterface.describeTable('corporateCardAccountClosureRequests');
        if (!closure.appliedAt) {
            await queryInterface.addColumn('corporateCardAccountClosureRequests', 'appliedAt', {
                type: Sequelize.DATE,
                allowNull: true,
            });
        }
        if (!closure.appliedResult) {
            await queryInterface.addColumn('corporateCardAccountClosureRequests', 'appliedResult', {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }
    },

    down: async (queryInterface) => {
        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        if (application.isDeleted) {
            await queryInterface.removeColumn('corporateCardAdminApplications', 'isDeleted');
        }
        const closure = await queryInterface.describeTable('corporateCardAccountClosureRequests');
        for (const column of ['appliedAt', 'appliedResult']) {
            if (closure[column]) {
                await queryInterface.removeColumn('corporateCardAccountClosureRequests', column);
            }
        }
    },
};
