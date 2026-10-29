'use strict';

const TIMESTAMPS = (Sequelize) => ({
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
});

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        if (!application.agreementSignMethod) {
            await queryInterface.addColumn('corporateCardAdminApplications', 'agreementSignMethod', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
        if (!application.esignStatus) {
            await queryInterface.addColumn('corporateCardAdminApplications', 'esignStatus', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
        if (!application.esignReference) {
            await queryInterface.addColumn('corporateCardAdminApplications', 'esignReference', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        const tables = await queryInterface.showAllTables();
        if (tables.includes('corporateCardAgreements')) return;

        await queryInterface.createTable('corporateCardAgreements', {
            id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
            corporateId: { type: Sequelize.INTEGER, allowNull: false, unique: true },

            entityName: { type: Sequelize.STRING, allowNull: true },

            regAddress: { type: Sequelize.STRING(500), allowNull: true },
            regCity: { type: Sequelize.STRING, allowNull: true },
            regState: { type: Sequelize.STRING, allowNull: true },
            regPinCode: { type: Sequelize.STRING(10), allowNull: true },
            regTelephone: { type: Sequelize.STRING(20), allowNull: true },
            regEmail: { type: Sequelize.STRING, allowNull: true },

            billSameAsRegistered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            billAddress: { type: Sequelize.STRING(500), allowNull: true },
            billCity: { type: Sequelize.STRING, allowNull: true },
            billState: { type: Sequelize.STRING, allowNull: true },
            billPinCode: { type: Sequelize.STRING(10), allowNull: true },

            gstNumber: { type: Sequelize.STRING(20), allowNull: true },
            panNumber: { type: Sequelize.STRING(12), allowNull: true },
            cinLlpNumber: { type: Sequelize.STRING(30), allowNull: true },
            tanNumber: { type: Sequelize.STRING(20), allowNull: true },

            bankName: { type: Sequelize.STRING, allowNull: true },
            bankBranch: { type: Sequelize.STRING, allowNull: true },
            bankAccountNumber: { type: Sequelize.STRING(30), allowNull: true },
            bankIfsc: { type: Sequelize.STRING(15), allowNull: true },
            bankCity: { type: Sequelize.STRING, allowNull: true },

            officialContactName: { type: Sequelize.STRING, allowNull: true },
            officialContactMobile: { type: Sequelize.STRING(20), allowNull: true },
            officialContactEmail: { type: Sequelize.STRING, allowNull: true },

            salespersonName: { type: Sequelize.STRING, allowNull: true },
            salespersonMobile: { type: Sequelize.STRING(20), allowNull: true },
            salespersonEmail: { type: Sequelize.STRING, allowNull: true },

            signatoryName: { type: Sequelize.STRING, allowNull: true },
            signatoryContact: { type: Sequelize.STRING(20), allowNull: true },
            signatoryEmail: { type: Sequelize.STRING, allowNull: true },
            signatoryIsPep: { type: Sequelize.BOOLEAN, allowNull: true },

            isDraft: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            generatedDocumentKey: { type: Sequelize.STRING(500), allowNull: true },
            ...TIMESTAMPS(Sequelize),
        }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

        await queryInterface.addIndex('corporateCardAgreements', ['corporateId'], {
            unique: true,
            name: 'ccAgreement_corporate_unique',
        });
    },

    down: async (queryInterface) => {
        const tables = await queryInterface.showAllTables();
        if (tables.includes('corporateCardAgreements')) {
            await queryInterface.dropTable('corporateCardAgreements');
        }
        const application = await queryInterface.describeTable('corporateCardAdminApplications');
        for (const column of ['agreementSignMethod', 'esignStatus', 'esignReference']) {
            if (application[column]) {
                await queryInterface.removeColumn('corporateCardAdminApplications', column);
            }
        }
    },
};
