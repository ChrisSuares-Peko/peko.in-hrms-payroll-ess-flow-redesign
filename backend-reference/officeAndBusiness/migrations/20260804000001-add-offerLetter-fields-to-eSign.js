'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const eSignDesc = await queryInterface.describeTable('eSigns');
        if (!eSignDesc.isOfferLetter) {
            await queryInterface.addColumn('eSigns', 'isOfferLetter', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            });
        }
        if (!eSignDesc.offerLetterEmployeeId) {
            await queryInterface.addColumn('eSigns', 'offerLetterEmployeeId', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('eSigns', 'isOfferLetter');
        await queryInterface.removeColumn('eSigns', 'offerLetterEmployeeId');
    },
};
