'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            "ALTER TABLE `subscriptions` MODIFY COLUMN `paymentMode` ENUM('PAYMENT GATEWAY', 'ACTIVATION_CODE', 'WALLET') NULL DEFAULT NULL;"
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            "ALTER TABLE `subscriptions` MODIFY COLUMN `paymentMode` ENUM('PAYMENT GATEWAY', 'ACTIVATION_CODE') NULL DEFAULT NULL;"
        );
    },
};
