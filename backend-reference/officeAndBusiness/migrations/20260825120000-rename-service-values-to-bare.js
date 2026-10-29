'use strict';

// Renames adminEmailTemplates.service from the old namespaced values to bare
// values, matching AE's convention. Safe to re-run — each rename checks first.
// OTHERS_AUTH and USERS_AUTH both collapse into AUTH; down() splits them back
// apart using each side's disjoint key list.
const OTHERS_AUTH_KEYS = ['OTP_VERIFICATION_COMMON', 'OTP_MFA_LOGIN'];
const USERS_AUTH_KEYS = ['SIGNUP_OTP', 'CORPORATE_ACCOUNT_CREATED', 'OTP_VERIFICATION'];

const SIMPLE_RENAMES = [
  ['OTHERS_SYSTEM_USER', 'SYSTEM_USER'],
  ['OTHERS_PROFILE', 'PROFILE'],
  ['OTHERS_HOTEL', 'HOTEL'],
  ['OTHERS_REFERRAL', 'REFERRAL'],
  ['USERS_PASSWORD', 'PASSWORD'],
  ['USERS_SUBCORPORATE_USER', 'SUBCORPORATE_USER'],
  ['USERS_ESS_PORTAL', 'ESS_PORTAL'],
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
    await renameServiceIfNeeded(
      queryInterface, Sequelize,
      { clause: "service IN ('OTHERS_AUTH', 'USERS_AUTH')", replacements: {} },
      'AUTH'
    );
    for (const [from, to] of SIMPLE_RENAMES) {
      await renameServiceIfNeeded(
        queryInterface, Sequelize,
        { clause: 'service = :from', replacements: { from } },
        to
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await renameServiceIfNeeded(
      queryInterface, Sequelize,
      { clause: 'service = :auth AND `key` IN (:keys)', replacements: { auth: 'AUTH', keys: OTHERS_AUTH_KEYS } },
      'OTHERS_AUTH'
    );
    await renameServiceIfNeeded(
      queryInterface, Sequelize,
      { clause: 'service = :auth AND `key` IN (:keys)', replacements: { auth: 'AUTH', keys: USERS_AUTH_KEYS } },
      'USERS_AUTH'
    );
    for (const [from, to] of SIMPLE_RENAMES) {
      await renameServiceIfNeeded(
        queryInterface, Sequelize,
        { clause: 'service = :to', replacements: { to } },
        from
      );
    }
  },
};
