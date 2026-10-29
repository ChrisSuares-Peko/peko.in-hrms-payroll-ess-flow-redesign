'use strict';

// The refund-tracking feature (refundDue, REFUND_DUE/REFUNDED invoice status, refunds table)
// is being removed. Any INVOICE row still sitting at REFUNDED (fully settled — refundDue had
// already reached 0) is reassigned to PAID, its natural equivalent once refund tracking is
// gone. REFUNDED itself stays a valid status value going forward, but only for CREDIT_NOTE
// rows (see the credit-note status dropdown).
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE invoicings SET status = 'PAID' WHERE status = 'REFUNDED' AND documentType = 'INVOICE'`
    );
  },

  down: async () => {
    // Not reversible: which of these PAID rows were previously REFUNDED is no longer known.
  },
};
