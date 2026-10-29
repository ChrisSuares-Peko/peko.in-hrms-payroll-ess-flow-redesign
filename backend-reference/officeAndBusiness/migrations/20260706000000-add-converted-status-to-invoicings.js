'use strict';

module.exports = {
    up: async (queryInterface) => {
        await queryInterface.sequelize.query(
            "ALTER TABLE invoicings MODIFY COLUMN status ENUM('PENDING','PAID','CANCELLED','OVERDUE','REJECTED','APPROVED','ACCEPTED','COMPLETED','PARTIAL','CONVERTED') DEFAULT 'PENDING'"
        );
    },
    down: async (queryInterface) => {
        await queryInterface.sequelize.query(
            "ALTER TABLE invoicings MODIFY COLUMN status ENUM('PENDING','PAID','CANCELLED','OVERDUE','REJECTED','APPROVED','ACCEPTED','COMPLETED','PARTIAL') DEFAULT 'PENDING'"
        );
    },
};
