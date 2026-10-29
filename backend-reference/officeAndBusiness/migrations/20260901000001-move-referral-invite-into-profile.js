'use strict';

// Moves the REFERRAL_INVITE row to PROFILE (AE files its referral email under
// PROFILE, not a separate service). Safe to re-run — checks first.
const renameIfNeeded = async (queryInterface, Sequelize, from, to) => {
  const [rows] = await queryInterface.sequelize.query(
    "SELECT COUNT(*) as count FROM adminEmailTemplates WHERE service = :from AND `key` = 'REFERRAL_INVITE'",
    { replacements: { from }, type: Sequelize.QueryTypes.SELECT }
  );
  if (!rows || Number(rows.count) === 0) return;
  await queryInterface.sequelize.query(
    "UPDATE adminEmailTemplates SET service = :to WHERE service = :from AND `key` = 'REFERRAL_INVITE'",
    { replacements: { from, to }, type: Sequelize.QueryTypes.UPDATE }
  );
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await renameIfNeeded(queryInterface, Sequelize, 'REFERRAL', 'PROFILE');
  },

  down: async (queryInterface, Sequelize) => {
    await renameIfNeeded(queryInterface, Sequelize, 'PROFILE', 'REFERRAL');
  },
};
