'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('orders');
      
      if (!tableDescription.userCouponId) {
        // Add userCouponId column
        await queryInterface.addColumn('orders', 'userCouponId', {
          type: Sequelize.BIGINT,
          allowNull: true,
        });

        console.log('Successfully added userCouponId column to orders table');
      } else {
        console.log('userCouponId column already exists in orders table');
      }
    } catch (error) {
      console.error('Error adding userCouponId column:', error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    try {
      const tableDescription = await queryInterface.describeTable('orders');
      
      if (tableDescription.userCouponId) {
        // Remove column
        await queryInterface.removeColumn('orders', 'userCouponId');
        
        console.log('Successfully removed userCouponId column from orders table');
      } else {
        console.log('userCouponId column does not exist in orders table');
      }
    } catch (error) {
      console.error('Error removing userCouponId column:', error);
      throw error;
    }
  }
};

