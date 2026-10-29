'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('referral_codes');
      
      // Add partnerId column if it doesn't exist
      if (!tableDescription.partnerId) {
        await queryInterface.addColumn('referral_codes', 'partnerId', {
          type: Sequelize.STRING,
          allowNull: true,
        });
        console.log('Successfully added partnerId column to referral_codes table');
      } else {
        console.log('partnerId column already exists in referral_codes table');
      }

      // Add serviceRule column if it doesn't exist
      if (!tableDescription.serviceRule) {
        await queryInterface.addColumn('referral_codes', 'serviceRule', {
          type: Sequelize.STRING,
          allowNull: true,
        });
        console.log('Successfully added serviceRule column to referral_codes table');
      } else {
        console.log('serviceRule column already exists in referral_codes table');
      }

      // Add serviceOperatorIds column if it doesn't exist
      if (!tableDescription.serviceOperatorIds) {
        await queryInterface.addColumn('referral_codes', 'serviceOperatorIds', {
          type: Sequelize.JSON,
          allowNull: true,
          defaultValue: [],
        });
        console.log('Successfully added serviceOperatorIds column to referral_codes table');
      } else {
        console.log('serviceOperatorIds column already exists in referral_codes table');
      }
    } catch (error) {
      console.error('Error adding columns to referral_codes table:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable('referral_codes');
      
      // Remove serviceOperatorIds column if it exists
      if (tableDescription.serviceOperatorIds) {
        await queryInterface.removeColumn('referral_codes', 'serviceOperatorIds');
        console.log('Successfully removed serviceOperatorIds column from referral_codes table');
      } else {
        console.log('serviceOperatorIds column does not exist in referral_codes table');
      }

      // Remove serviceRule column if it exists
      if (tableDescription.serviceRule) {
        await queryInterface.removeColumn('referral_codes', 'serviceRule');
        console.log('Successfully removed serviceRule column from referral_codes table');
      } else {
        console.log('serviceRule column does not exist in referral_codes table');
      }

      // Remove partnerId column if it exists
      if (tableDescription.partnerId) {
        await queryInterface.removeColumn('referral_codes', 'partnerId');
        console.log('Successfully removed partnerId column from referral_codes table');
      } else {
        console.log('partnerId column does not exist in referral_codes table');
      }
    } catch (error) {
      console.error('Error removing columns from referral_codes table:', error);
      throw error;
    }
  }
};
