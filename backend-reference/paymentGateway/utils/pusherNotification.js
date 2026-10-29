/**
 * Pusher Notification Service
 * Sends real-time payment status updates to frontend
 * Notifies when bulk eSIM payments complete (success or failure)
 */

const Pusher = require('pusher');

const pusher = new Pusher({
  appId: '1986496',
  key: 'c071f84777ea23ecd9a6',
  secret: 'REDACTED',
  cluster: 'ap2',
  encrypted: true,
});

/**
 * Send bulk payment status update via Pusher
 * Frontend listens on channel: 'update-bulk-payment-status'
 * Event: 'real-time-notification'
 * @param {number} credentialId - User ID
 * @param {Object} message - { corporateTxnId, status, walletBalance }
 */
async function updateBulkPaymentStatus(credentialId, message) {
  try {
    await pusher.trigger('update-bulk-payment-status', 'real-time-notification', {
      credentialId,
      message,
    });
  } catch (error) {
    console.error('[PUSHER ERROR] Failed to send bulk payment status:', error.message);
    // Don't throw — Pusher failure shouldn't break payment processing
    // Frontend has polling as fallback
  }
}

async function notifyPGPaymentConfirmed(credentialId, batchId, corporateTxnId, redisKey = null, status = 'SUCCESS') {
  try {
    await pusher.trigger('corporate-pg-payment', 'payment-pg-confirmed', {
      credentialId,
      batchId,
      corporateTxnId,
      status,
      ...(redisKey && { redisKey }),
    });
  } catch (error) {
    console.error('[PUSHER ERROR] Failed to send PG payment confirmed:', error.message);
  }
}

module.exports = { updateBulkPaymentStatus, notifyPGPaymentConfirmed };
