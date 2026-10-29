'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE rfq_vendor_invites MODIFY COLUMN status ENUM('Draft','Invited','Declined','Submitted') NOT NULL DEFAULT 'Invited'"
    );
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "DELETE FROM rfq_vendor_invites WHERE status = 'Draft'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE rfq_vendor_invites MODIFY COLUMN status ENUM('Invited','Declined','Submitted') NOT NULL DEFAULT 'Invited'"
    );
  },
};
