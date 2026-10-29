module.exports = {
    up: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable('transactions');
        if (!columns.journalRecordStatus) {
            await queryInterface.addColumn('transactions', 'journalRecordStatus', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
        if (!columns.journalData) {
            await queryInterface.addColumn('transactions', 'journalData', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });
        }
    },
    down: async (queryInterface) => {
        const columns = await queryInterface.describeTable('transactions');
        if (columns.journalRecordStatus) await queryInterface.removeColumn('transactions', 'journalRecordStatus');
        if (columns.journalData) await queryInterface.removeColumn('transactions', 'journalData');
    },
};
