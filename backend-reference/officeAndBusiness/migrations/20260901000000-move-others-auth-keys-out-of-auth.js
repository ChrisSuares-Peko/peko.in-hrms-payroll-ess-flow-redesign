'use strict';

// Moves others' two AUTH-service rows to ORDERS/PROFILE (AE has no AUTH in
// others). Safe to re-run — each rename checks first.
const renameServiceIfNeeded = async (queryInterface, Sequelize, key, to) => {
  const [rows] = await queryInterface.sequelize.query(
    "SELECT COUNT(*) as count FROM adminEmailTemplates WHERE service = 'AUTH' AND `key` = :key",
    { replacements: { key }, type: Sequelize.QueryTypes.SELECT }
  );
  if (!rows || Number(rows.count) === 0) return;
  await queryInterface.sequelize.query(
    "UPDATE adminEmailTemplates SET service = :to WHERE service = 'AUTH' AND `key` = :key",
    { replacements: { key, to }, type: Sequelize.QueryTypes.UPDATE }
  );
};

const renameServiceBackIfNeeded = async (queryInterface, Sequelize, from, key) => {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT COUNT(*) as count FROM adminEmailTemplates WHERE service = :from AND `key` = :key',
    { replacements: { from, key }, type: Sequelize.QueryTypes.SELECT }
  );
  if (!rows || Number(rows.count) === 0) return;
  await queryInterface.sequelize.query(
    "UPDATE adminEmailTemplates SET service = 'AUTH' WHERE service = :from AND `key` = :key",
    { replacements: { from, key }, type: Sequelize.QueryTypes.UPDATE }
  );
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await renameServiceIfNeeded(queryInterface, Sequelize, 'OTP_VERIFICATION_COMMON', 'ORDERS');
    await renameServiceIfNeeded(queryInterface, Sequelize, 'OTP_MFA_LOGIN', 'PROFILE');
  },

  down: async (queryInterface, Sequelize) => {
    await renameServiceBackIfNeeded(queryInterface, Sequelize, 'ORDERS', 'OTP_VERIFICATION_COMMON');
    await renameServiceBackIfNeeded(queryInterface, Sequelize, 'PROFILE', 'OTP_MFA_LOGIN');
  },
};
