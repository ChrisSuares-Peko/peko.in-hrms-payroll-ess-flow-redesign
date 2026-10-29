'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE 'proposals'`);
    if (!tables.length) return;

    await queryInterface.sequelize.query(
      `ALTER TABLE proposals MODIFY COLUMN status ENUM('Submitted', 'Accepted', 'Declined', 'Under Review', 'Rejected') NOT NULL DEFAULT 'Submitted'`
    );
    await queryInterface.sequelize.query(
      `UPDATE proposals SET status = 'Under Review' WHERE status = 'Submitted'`
    );
    await queryInterface.sequelize.query(
      `UPDATE proposals SET status = 'Rejected' WHERE status = 'Declined'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE proposals MODIFY COLUMN status ENUM('Under Review', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Under Review'`
    );
  },

  down: async (queryInterface) => {
    const [tables] = await queryInterface.sequelize.query(`SHOW TABLES LIKE 'proposals'`);
    if (!tables.length) return;

    await queryInterface.sequelize.query(
      `ALTER TABLE proposals MODIFY COLUMN status ENUM('Submitted', 'Accepted', 'Declined', 'Under Review', 'Rejected') NOT NULL DEFAULT 'Submitted'`
    );
    await queryInterface.sequelize.query(
      `UPDATE proposals SET status = 'Submitted' WHERE status = 'Under Review'`
    );
    await queryInterface.sequelize.query(
      `UPDATE proposals SET status = 'Declined' WHERE status = 'Rejected'`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE proposals MODIFY COLUMN status ENUM('Submitted', 'Accepted', 'Declined') NOT NULL DEFAULT 'Submitted'`
    );
  },
};
