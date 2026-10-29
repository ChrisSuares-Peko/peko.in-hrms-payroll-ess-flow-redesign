'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('peko_credits');
      
      if (!tableDescription.referralCodeId) {
        // Add referralCodeId column
        await queryInterface.addColumn('peko_credits', 'referralCodeId', {
          type: Sequelize.BIGINT,
          allowNull: true,
        });

        // Add foreign key constraint
        await queryInterface.addConstraint('peko_credits', {
          fields: ['referralCodeId'],
          type: 'foreign key',
          name: 'fk_peko_credits_referralCodeId',
          references: {
            table: 'referral_codes',
            field: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        });

        console.log('Successfully added referralCodeId column and foreign key to peko_credits table');
      } else {
        console.log('referralCodeId column already exists in peko_credits table');
      }
    } catch (error) {
      console.error('Error adding referralCodeId column:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable('peko_credits');
      
      if (tableDescription.referralCodeId) {
        // Remove foreign key constraint first
        await queryInterface.removeConstraint('peko_credits', 'fk_peko_credits_referralCodeId');
        
        // Remove column
        await queryInterface.removeColumn('peko_credits', 'referralCodeId');
        
        console.log('Successfully removed referralCodeId column and foreign key from peko_credits table');
      } else {
        console.log('referralCodeId column does not exist in peko_credits table');
      }
    } catch (error) {
      console.error('Error removing referralCodeId column:', error);
      throw error;
    }
  }
};
