'use strict';

// Narrows the invoicingV2.status ENUM back down, dropping REFUND_DUE. REFUNDED is kept —
// it no longer applies to invoices (that flow is removed) but is reused as one of the two
// Credit Note statuses (PENDING | REFUNDED, set via the credit-note status dropdown).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');
    if (!tableDesc.status.type.includes('REFUND_DUE')) {
      return; // already narrowed — nothing to do
    }

    // Any row still sitting at REFUND_DUE would violate the narrower ENUM below (MySQL
    // rejects an ALTER that leaves an existing row's value outside the new set, under
    // strict SQL mode). Its refundDue liability is being dropped along with the whole
    // refund-tracking feature, so reassign to PAID first, same as the REFUNDED rows in
    // the 20260929000000 migration.
    await queryInterface.sequelize.query(
      `UPDATE invoicings SET status = 'PAID' WHERE status = 'REFUND_DUE' AND documentType = 'INVOICE'`
    );

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
        'CONVERTED',
        'REFUND_DUE',
        'REFUNDED'
      ),
      defaultValue: 'PENDING',
    });
  },
};
