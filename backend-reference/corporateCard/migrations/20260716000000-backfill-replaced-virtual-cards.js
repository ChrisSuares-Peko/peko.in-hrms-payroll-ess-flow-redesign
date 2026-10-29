'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE cardIssuances AS v
      INNER JOIN cardIssuances AS p 
        ON v.referenceNumber = p.referenceNumber
      SET 
        v.status = 'REPLACED',
        v.updatedAt = NOW()
      WHERE v.cardType = 'Virtual'
        AND v.status = 'ISSUED'
        AND p.cardType = 'Physical'
        AND p.status = 'ISSUED'
        AND v.referenceNumber IS NOT NULL;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE cardIssuances AS v
      INNER JOIN cardIssuances AS p 
        ON v.referenceNumber = p.referenceNumber
      SET 
        v.status = 'ISSUED',
        v.updatedAt = NOW()
      WHERE v.cardType = 'Virtual'
        AND v.status = 'REPLACED'
        AND p.cardType = 'Physical'
        AND p.status = 'ISSUED'
        AND v.referenceNumber IS NOT NULL;
    `);
  }
};
