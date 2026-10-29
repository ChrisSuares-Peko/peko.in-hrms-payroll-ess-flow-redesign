'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const tableDesc = await queryInterface.describeTable('domainHostingPlans');
        const colType = (tableDesc.planType?.type || '').toUpperCase();
        if (colType.includes('VARCHAR') || colType === 'STRING') return;
        await queryInterface.sequelize.query(
            'ALTER TABLE `domainHostingPlans` MODIFY COLUMN `planType` VARCHAR(100);'
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            "ALTER TABLE `domainHostingPlans` MODIFY COLUMN `planType` ENUM('vps_server', 'shared_hosting', 'titan_email', 'google_workspace');"
        );
    },
};