'use strict';

// Widens the invoicingV2.status ENUM to add REFUND_DUE and REFUNDED, so an invoice can be
// flagged as owing a refund (Credit Note credited more than what was still due) and later
// settled once the refund is recorded, instead of silently staying "PAID".
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('invoicings', 'status', {
      type: Sequelize.ENUM(
        'PENDING',
        'PAID',
        'CANCELLED',
        'OVERDUE',
        'REJECTED',
        'APPROVED',
        'ACCEPTED',
        'COMPLETED',
        'PARTIAL',
        'CONVERTED',
        'REFUND_DUE',
        'REFUNDED'
      ),
      defaultValue: 'PENDING',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('invoicings', 'status', {
      type: Sequelize.ENUM(
        'PENDING',
        'PAID',
        'CANCELLED',
        'OVERDUE',
        'REJECTED',
        'APPROVED',
        'ACCEPTED',
        'COMPLETED',
        'PARTIAL',
        'CONVERTED'
      ),
      defaultValue: 'PENDING',
    });
  },
};
