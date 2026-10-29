module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('manualPayments', 'receiptNo', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('manualPayments', 'receiptNo');
    },
};
