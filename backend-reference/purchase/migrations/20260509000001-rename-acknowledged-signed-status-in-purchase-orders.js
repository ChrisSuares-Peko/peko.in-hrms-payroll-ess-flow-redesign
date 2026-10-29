'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Step 1: Add 'Acknowledged' to ENUM while keeping the old value
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'Sent', 'Acknowledged & Signed', 'Acknowledged', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft'`
    );

    // Step 2: Migrate existing rows to the new value
    await queryInterface.sequelize.query(
      `UPDATE purchase_orders SET status = 'Acknowledged' WHERE status = 'Acknowledged & Signed'`
    );

    // Step 3: Remove the old value from ENUM
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'Sent', 'Acknowledged', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft'`
    );
  },

  down: async (queryInterface) => {
    // Revert rows back
    await queryInterface.sequelize.query(
      `UPDATE purchase_orders SET status = 'Acknowledged & Signed' WHERE status = 'Acknowledged'`
    );

    // Revert the ENUM column
    await queryInterface.sequelize.query(
      `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('Draft', 'Sent', 'Acknowledged & Signed', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft'`
    );
  }
};
