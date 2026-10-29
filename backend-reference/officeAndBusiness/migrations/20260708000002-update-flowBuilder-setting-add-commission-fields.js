'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, details FROM settings WHERE name = 'flowBuilder' LIMIT 1"
    );

    const commissionDefaults = {
      commissionType: 'PERCENTAGE',
      commission: 0,
      fixedCommissionPerTransaction: 0,
      isCommissionInclGST: true,
    };

    if (rows.length > 0) {
      const existing = typeof rows[0].details === 'string' ? JSON.parse(rows[0].details) : rows[0].details;

      const updated = { ...existing };

      // Remove vendorPrice if present — no longer used
      if ('vendorPrice' in updated) {
        delete updated.vendorPrice;
      }

      // Add commission fields only if not already present
      if (updated.commissionType === undefined) {
        Object.assign(updated, commissionDefaults);
      }

      await queryInterface.sequelize.query(
        `UPDATE settings SET details = :details, updatedAt = NOW() WHERE name = 'flowBuilder'`,
        { replacements: { details: JSON.stringify(updated) } }
      );
    } else {
      // Row doesn't exist — insert with full defaults (no vendorPrice)
      const defaultDetails = {
        amount: 120,
        ...commissionDefaults,
      };
      await queryInterface.sequelize.query(
        `INSERT INTO settings (name, details, createdAt, updatedAt) VALUES ('flowBuilder', :details, NOW(), NOW())`,
        { replacements: { details: JSON.stringify(defaultDetails) } }
      );
    }
  },

  down: async (queryInterface) => {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, details FROM settings WHERE name = 'flowBuilder' LIMIT 1"
    );

    if (rows.length > 0) {
      const existing = typeof rows[0].details === 'string' ? JSON.parse(rows[0].details) : rows[0].details;
      const restored = { ...existing, vendorPrice: 110 };
      delete restored.commissionType;
      delete restored.commission;
      delete restored.fixedCommissionPerTransaction;
      delete restored.isCommissionInclGST;

      await queryInterface.sequelize.query(
        `UPDATE settings SET details = :details, updatedAt = NOW() WHERE name = 'flowBuilder'`,
        { replacements: { details: JSON.stringify(restored) } }
      );
    }
  },
};
