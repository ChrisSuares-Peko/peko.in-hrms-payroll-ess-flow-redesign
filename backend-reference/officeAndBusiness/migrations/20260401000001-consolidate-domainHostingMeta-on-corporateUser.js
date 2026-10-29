'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('corporateUsers');

        if (!tableDesc.domainHostingMeta) {
            await queryInterface.addColumn('corporateUsers', 'domainHostingMeta', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: null,
            });

            // Migrate existing customerId values into the new column
            if (tableDesc.domainHostingCustomerId) {
                await queryInterface.sequelize.query(`
                    UPDATE corporateUsers
                    SET domainHostingMeta = JSON_OBJECT('customerId', domainHostingCustomerId)
                    WHERE domainHostingCustomerId IS NOT NULL
                `);
            }
        }

        // Drop the old column if it still exists
        if (tableDesc.domainHostingCustomerId) {
            await queryInterface.removeColumn('corporateUsers', 'domainHostingCustomerId');
        }
    },

    async down(queryInterface, Sequelize) {
        // Restore the old column
        await queryInterface.addColumn('corporateUsers', 'domainHostingCustomerId', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        });

        // Restore customerId values from meta
        await queryInterface.sequelize.query(`
            UPDATE corporateUsers
            SET domainHostingCustomerId = JSON_UNQUOTE(JSON_EXTRACT(domainHostingMeta, '$.customerId'))
            WHERE domainHostingMeta IS NOT NULL
        `);

        await queryInterface.removeColumn('corporateUsers', 'domainHostingMeta');
    },
};
