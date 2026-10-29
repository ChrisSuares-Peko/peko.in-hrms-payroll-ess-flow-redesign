'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tableDesc = await queryInterface.describeTable('tax_gstr1_filings').catch(() => null);
    if (!tableDesc) return; // table doesn't exist, skip

    // Remove duplicate rows keeping the latest (highest id)
    await queryInterface.sequelize.query(`
      DELETE t1 FROM tax_gstr1_filings t1
      INNER JOIN tax_gstr1_filings t2
      WHERE t1.id > t2.id
        AND t1.corporateUserId = t2.corporateUserId
        AND t1.gstin           = t2.gstin
        AND t1.financialYear   = t2.financialYear
        AND t1.month           = t2.month
    `);

    // Add unique constraint — skip if already exists
    await queryInterface.addConstraint('tax_gstr1_filings', {
      fields: ['corporateUserId', 'gstin', 'financialYear', 'month'],
      type: 'unique',
      name: 'uq_tax_gstr1_filings_user_gstin_fy_month',
    }).catch(() => {}); // silently skip if constraint already exists
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('tax_gstr1_filings').catch(() => null);
    if (!tableDesc) return;
    await queryInterface.removeConstraint('tax_gstr1_filings', 'uq_tax_gstr1_filings_user_gstin_fy_month').catch(() => {});
  },
};
