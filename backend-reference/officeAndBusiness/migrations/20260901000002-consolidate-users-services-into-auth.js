'use strict';

// Moves users' PASSWORD/SUBCORPORATE_USER/ESS_PORTAL rows into AUTH (AE has no
// split — everything users owns is AUTH). Safe to re-run — checks first.
const RENAMES = [
  ['PASSWORD', 'AUTH'],
  ['SUBCORPORATE_USER', 'AUTH'],
  ['ESS_PORTAL', 'AUTH'],
];

// Each key has exactly one origin service, so down() can reverse deterministically.
const KEY_ORIGINS = [
  ['PASSWORD', ['RESET_PASSWORD', 'RESET_PASSWORD_SUCCESS', 'SET_PASSWORD', 'SET_NEW_PASSWORD']],
  ['SUBCORPORATE_USER', ['SUBCORPORATE_ACCESS_UPDATED', 'SUBCORPORATE_ACCESS_DISABLED']],
  ['ESS_PORTAL', ['ESS_WELCOME', 'ESS_EMAIL_CHANGED']],
];

const renameServiceIfNeeded = async (queryInterface, Sequelize, where, to) => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) as count FROM adminEmailTemplates WHERE ${where.clause}`,
    { replacements: where.replacements, type: Sequelize.QueryTypes.SELECT }
  );
  if (!rows || Number(rows.count) === 0) return;
  await queryInterface.sequelize.query(
    `UPDATE adminEmailTemplates SET service = :to WHERE ${where.clause}`,
    { replacements: { ...where.replacements, to }, type: Sequelize.QueryTypes.UPDATE }
  );
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const [from, to] of RENAMES) {
      await renameServiceIfNeeded(
        queryInterface, Sequelize,
        { clause: 'service = :from', replacements: { from } },
        to
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const [service, keys] of KEY_ORIGINS) {
      await renameServiceIfNeeded(
        queryInterface, Sequelize,
        { clause: 'service = :auth AND `key` IN (:keys)', replacements: { auth: 'AUTH', keys } },
        service
      );
    }
  },
};
