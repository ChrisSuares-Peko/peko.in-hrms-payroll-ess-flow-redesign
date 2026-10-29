'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'purchase_requests'`
    );
    if (!tables.length) return;

    // Step 1: Expand ENUM to include both old and new values so existing rows remain valid
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('Draft', 'Open', 'Converted to RFQ', 'Converted to PO', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Draft'`
    );

    // Step 2: Migrate 'Closed' → 'Cancelled'
    await queryInterface.sequelize.query(
      `UPDATE purchase_requests SET status = 'Cancelled' WHERE status = 'Closed'`
    );

    // Step 3: Remove the old 'Closed' value from ENUM
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('Draft', 'Open', 'Converted to RFQ', 'Converted to PO', 'Cancelled') NOT NULL DEFAULT 'Draft'`
    );
  },

  down: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'purchase_requests'`
    );
    if (!tables.length) return;

    // Step 1: Expand ENUM to include both values during rollback
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('Draft', 'Open', 'Converted to RFQ', 'Converted to PO', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Open'`
    );

    // Step 2: Revert 'Cancelled' → 'Closed'
    await queryInterface.sequelize.query(
      `UPDATE purchase_requests SET status = 'Closed' WHERE status = 'Cancelled'`
    );

    // Step 3: Restore original ENUM (no 'Draft', no 'Cancelled')
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_requests MODIFY COLUMN status ENUM('Open', 'Converted to RFQ', 'Converted to PO', 'Closed') NOT NULL DEFAULT 'Open'`
    );
  },
};
