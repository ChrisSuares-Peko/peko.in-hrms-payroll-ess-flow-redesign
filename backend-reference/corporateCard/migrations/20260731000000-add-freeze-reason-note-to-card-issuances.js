'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const desc = await queryInterface.describeTable('cardIssuances');
    if (desc.freezeReasonNote) return;
    await queryInterface.addColumn('cardIssuances', 'freezeReasonNote', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'freezeReason',
      comment: 'Free-text detail for an admin freeze with reason Others (4); null otherwise',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('cardIssuances', 'freezeReasonNote');
  },
};
