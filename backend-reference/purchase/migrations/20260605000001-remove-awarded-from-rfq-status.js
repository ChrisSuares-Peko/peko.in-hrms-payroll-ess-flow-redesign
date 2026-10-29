'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'rfqs'`
    );
    if (!tables.length) return;

    await queryInterface.sequelize.query(
      `UPDATE rfqs SET status = 'Closed' WHERE status = 'Awarded'`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE rfqs MODIFY COLUMN status ENUM('Draft', 'Active', 'Closed') NOT NULL DEFAULT 'Draft'`
    );
  },

  down: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'rfqs'`
    );
    if (!tables.length) return;

    await queryInterface.sequelize.query(
      `ALTER TABLE rfqs MODIFY COLUMN status ENUM('Draft', 'Active', 'Closed', 'Awarded') NOT NULL DEFAULT 'Draft'`
    );
  },
};
