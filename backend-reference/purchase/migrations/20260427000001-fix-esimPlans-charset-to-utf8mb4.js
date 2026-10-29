'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE esimPlans CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE esimPlans CONVERT TO CHARACTER SET armscii8 COLLATE armscii8_general_ci;'
    );
  }
};
