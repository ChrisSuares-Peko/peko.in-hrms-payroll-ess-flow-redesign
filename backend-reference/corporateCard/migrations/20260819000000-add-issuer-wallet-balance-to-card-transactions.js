'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('cardTransactions')
        if (!table.issuerWalletBalance) {
            await queryInterface.addColumn('cardTransactions', 'issuerWalletBalance', {
                type: Sequelize.DECIMAL(14, 2),
                allowNull: true,
                after: 'transactionAmount',
            })
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('cardTransactions')
        if (table.issuerWalletBalance) {
            await queryInterface.removeColumn('cardTransactions', 'issuerWalletBalance')
        }
    },
}
