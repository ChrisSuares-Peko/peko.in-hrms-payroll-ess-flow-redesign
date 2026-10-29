'use strict';

// Existing enum values present in the live `credentials.role` column.
// We must preserve ALL of them and only append the new 'USER' value,
// otherwise MySQL truncates rows that use any of the other roles.
const EXISTING_ROLES = [
  'CORPORATE',
  'SYSTEM_USER',
  'CORPORATE_SUB_USER',
  'ADMIN',
  'INVESTOR',
  'SUPPORT',
  'FINANCE',
  'PARTNER',
  'VENDOR',
  'ECOM_MANAGER',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('credentials', 'role', {
      type: Sequelize.ENUM(...EXISTING_ROLES, 'USER'),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('credentials', 'role', {
      type: Sequelize.ENUM(...EXISTING_ROLES),
    });
  },
};
