'use strict';

const MANUAL_REFUND_STATUSES = Object.freeze([
  Object.freeze({ status: 'PENDING', name: 'Pending' }),
  Object.freeze({ status: 'IN_PROGRESS', name: 'In progress' }),
  Object.freeze({ status: 'SUCCESS', name: 'Refunded' }),
  Object.freeze({ status: 'FAILED', name: 'Rejected' }),
]);

const MANUAL_REFUND_TRANSITIONS = Object.freeze({
  PENDING: Object.freeze(['IN_PROGRESS', 'SUCCESS', 'FAILED']),
  IN_PROGRESS: Object.freeze(['SUCCESS', 'FAILED']),
});

module.exports = {
  MANUAL_REFUND_STATUSES,
  MANUAL_REFUND_TRANSITIONS,
};
