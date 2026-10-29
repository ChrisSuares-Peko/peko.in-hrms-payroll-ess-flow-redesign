'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'userCouponId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'user_coupons', 
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

 async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'userCouponId');
  },
};
