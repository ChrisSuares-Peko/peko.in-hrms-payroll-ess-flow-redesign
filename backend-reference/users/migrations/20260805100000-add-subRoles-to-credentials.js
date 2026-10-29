'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const desc = await queryInterface.describeTable('credentials');
        if (!desc.subRoles) {
            await queryInterface.addColumn('credentials', 'subRoles', {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }
    },
    async down(queryInterface) {
        const desc = await queryInterface.describeTable('credentials');
        if (desc.subRoles) {
            await queryInterface.removeColumn('credentials', 'subRoles');
        }
    },
};
