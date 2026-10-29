'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'rfqs'`
    );
    if (!tables.length) return;

    // Step 1: Add 'Active' to ENUM while keeping 'Sent'
    await queryInterface.sequelize.query(
      `ALTER TABLE rfqs MODIFY COLUMN status ENUM('Draft', 'Sent', 'Active', 'Closed', 'Awarded') NOT NULL DEFAULT 'Draft'`
    );

    // Step 2: Migrate existing 'Sent' rows to 'Active'
    await queryInterface.sequelize.query(
      `UPDATE rfqs SET status = 'Active' WHERE status = 'Sent'`
    );

    // Step 3: Remove 'Sent' from ENUM
    await queryInterface.sequelize.query(
      `ALTER TABLE rfqs MODIFY COLUMN status ENUM('Draft', 'Active', 'Closed', 'Awarded') NOT NULL DEFAULT 'Draft'`
    );
  },

  down: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'rfqs'`
    );
    if (!tables.length) return;

    // Step 1: Add 'Sent' back to ENUM while keeping 'Active'
    await queryInterface.sequelize.query(
      `ALTER TABLE rfqs MODIFY COLUMN status ENUM('Draft', 'Sent', 'Active', 'Closed', 'Awarded') NOT NULL DEFAULT 'Draft'`
    );

    // Step 2: Revert 'Active' rows back to 'Sent'
    await queryInterface.sequelize.query(
      `UPDATE rfqs SET status = 'Sent' WHERE status = 'Active'`
    );

    // Step 3: Remove 'Active' from ENUM
    await queryInterface.sequelize.query(
      `ALTER TABLE rfqs MODIFY COLUMN status ENUM('Draft', 'Sent', 'Closed', 'Awarded') NOT NULL DEFAULT 'Draft'`
    );
  },
};
