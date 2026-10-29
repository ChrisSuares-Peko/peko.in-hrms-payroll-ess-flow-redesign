'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('adminEmailTemplates');
    if (table.sender) return;

    await queryInterface.addColumn('adminEmailTemplates', 'sender', {
      // "From" value to send this template with, e.g. "Acme Corp <no-reply@acme.com>"
      // or a plain email (nodemailer accepts both). NULL keeps the send path's
      // current hardcoded default. Not part of the template's identity.
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('adminEmailTemplates');
    if (table.sender) {
      await queryInterface.removeColumn('adminEmailTemplates', 'sender');
    }
  },
};
