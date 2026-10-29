'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add a plain index on credentialId (skip if it already exists from a prior partial run)
    try {
      await queryInterface.addIndex('privacyPolicyAcceptances', {
        fields: ['credentialId'],
        name: 'idx_ppa_credentialId',
      });
    } catch (err) {
      if (!err.message.includes('Duplicate key name')) throw err;
    }

    // Drop the composite unique index (skip if already dropped)
    try {
      await queryInterface.removeIndex(
        'privacyPolicyAcceptances',
        'uniq_user_policy_version'
      );
    } catch (err) {
      if (!err.message.includes("check that column/key exists")) throw err;
    }

    // Remove privacyPolicyVersion column (skip if already removed)
    try {
      await queryInterface.removeColumn('privacyPolicyAcceptances', 'privacyPolicyVersion');
    } catch (err) {
      if (!err.message.includes("check that column/key exists")) throw err;
    }

    // Add privacyPolicyId foreign key referencing privacy_policy_details (skip if already added)
    try {
      await queryInterface.addColumn('privacyPolicyAcceptances', 'privacyPolicyId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'privacy_policy_details', key: 'id' },
      });
    } catch (err) {
      if (!err.message.includes('Duplicate column name')) throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('privacyPolicyAcceptances', 'privacyPolicyId');
    await queryInterface.removeIndex('privacyPolicyAcceptances', 'idx_ppa_credentialId');
  },
};
