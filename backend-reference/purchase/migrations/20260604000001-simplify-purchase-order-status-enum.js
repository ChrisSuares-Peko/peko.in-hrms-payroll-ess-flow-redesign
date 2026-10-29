'use strict';

module.exports = {
  async up(queryInterface) {
    // Step 1: Expand ENUM to include all old + new values
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'Sent', 'Acknowledged', 'In Progress', 'Completed', 'Cancelled', 'PO Issued', 'Closed') NOT NULL DEFAULT 'Draft'`
    );

    // Step 2: Migrate old values to new ones
    await queryInterface.sequelize.query(
      `UPDATE purchase_orders SET status = 'PO Issued' WHERE status IN ('Sent', 'Acknowledged', 'In Progress')`
    );
    await queryInterface.sequelize.query(
      `UPDATE purchase_orders SET status = 'Closed' WHERE status IN ('Completed', 'Cancelled')`
    );

    // Step 3: Lock down to new ENUM only
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'PO Issued', 'Closed') NOT NULL DEFAULT 'Draft'`
    );
  },

  async down(queryInterface) {
    // Step 1: Expand ENUM to include all values
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'Sent', 'Acknowledged', 'In Progress', 'Completed', 'Cancelled', 'PO Issued', 'Closed') NOT NULL DEFAULT 'Draft'`
    );

    // Step 2: Revert new values back to old ones
    await queryInterface.sequelize.query(
      `UPDATE purchase_orders SET status = 'Sent' WHERE status = 'PO Issued'`
    );
    await queryInterface.sequelize.query(
      `UPDATE purchase_orders SET status = 'Completed' WHERE status = 'Closed'`
    );

    // Step 3: Restore original ENUM
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'Sent', 'Acknowledged', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft'`
    );
  },
};
