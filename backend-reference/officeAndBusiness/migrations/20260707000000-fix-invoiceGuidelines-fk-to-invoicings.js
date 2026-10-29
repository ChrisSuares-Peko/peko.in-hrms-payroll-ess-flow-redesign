'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `invoiceGuidelines` DROP FOREIGN KEY `invoiceGuidelines_ibfk_1`;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE `invoiceGuidelines` ADD CONSTRAINT `invoiceGuidelines_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `invoicings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `invoiceGuidelines` DROP FOREIGN KEY `invoiceGuidelines_ibfk_1`;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE `invoiceGuidelines` ADD CONSTRAINT `invoiceGuidelines_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;'
    );
  },
};
