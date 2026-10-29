'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const indexes = await queryInterface.showIndex('corporateUsers');
    const uniqueMobileIndexes = indexes.filter(
      (index) =>
        index.unique &&
        !index.primary &&
        Array.isArray(index.fields) &&
        index.fields.length === 1 &&
        index.fields[0].attribute === 'mobileNo'
    );
    for (const index of uniqueMobileIndexes) {
      await queryInterface.removeIndex('corporateUsers', index.name);
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('corporateUsers');
    const hasUniqueMobileIndex = indexes.some(
      (index) =>
        index.unique &&
        Array.isArray(index.fields) &&
        index.fields.length === 1 &&
        index.fields[0].attribute === 'mobileNo'
    );
    if (!hasUniqueMobileIndex) {
      await queryInterface.addIndex('corporateUsers', ['mobileNo'], {
        unique: true,
        name: 'mobileNo',
      });
    }
  },
};
