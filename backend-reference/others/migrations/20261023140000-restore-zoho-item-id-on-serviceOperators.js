'use strict';

const TABLE = 'serviceOperators';

module.exports = {
    async up(queryInterface, Sequelize) {
        const description = await queryInterface.describeTable(TABLE);

        if (!description.zoho_item_id) {
            await queryInterface.addColumn(TABLE, 'zoho_item_id', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    async down() {
        // eslint-disable-next-line no-useless-return
        return;
    },
};
