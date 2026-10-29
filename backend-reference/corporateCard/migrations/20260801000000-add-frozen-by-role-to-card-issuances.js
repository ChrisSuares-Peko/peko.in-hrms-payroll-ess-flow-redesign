'use strict';

const FREEZE_ACTOR = { ADMIN: 'ADMIN', CARDHOLDER: 'CARDHOLDER', SYSTEM: 'SYSTEM' };

const SYSTEM_FREEZE_NOTES = ['Card termination requested', 'Member removed from the corporate'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = 'cardIssuances';
    const desc = await queryInterface.describeTable(table);

    if (!desc.frozenByRole) {
      await queryInterface.addColumn(table, 'frozenByRole', {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: 'freezeReasonNote',
        comment: 'Who placed the current freeze (ADMIN|CARDHOLDER|SYSTEM); null when cardState=ACTIVE',
      });
    }

    await queryInterface.sequelize.query(
      `UPDATE ${table} SET frozenByRole = :actor
        WHERE cardState = 'FROZEN' AND frozenByRole IS NULL AND freezeReasonNote IN (:notes)`,
      { replacements: { actor: FREEZE_ACTOR.SYSTEM, notes: SYSTEM_FREEZE_NOTES } }
    );
    await queryInterface.sequelize.query(
      `UPDATE ${table} SET frozenByRole = :actor
        WHERE cardState = 'FROZEN' AND frozenByRole IS NULL AND freezeReason IS NOT NULL`,
      { replacements: { actor: FREEZE_ACTOR.ADMIN } }
    );
    await queryInterface.sequelize.query(
      `UPDATE ${table} SET frozenByRole = :actor
        WHERE cardState = 'FROZEN' AND frozenByRole IS NULL AND freezeReason IS NULL`,
      { replacements: { actor: FREEZE_ACTOR.CARDHOLDER } }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('cardIssuances', 'frozenByRole');
  },
};
