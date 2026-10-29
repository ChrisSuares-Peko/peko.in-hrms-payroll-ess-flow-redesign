const Pusher = require('pusher');
const { customLog } = require('./loggerHelper');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    encrypted: true,
});

async function notifyPGPaymentConfirmed(
    credentialId,
    batchId,
    corporateTxnId,
    redisKey = null,
    status = 'SUCCESS'
) {
    try {
        await pusher.trigger('corporate-pg-payment', 'payment-pg-confirmed', {
            credentialId,
            batchId,
            corporateTxnId,
            status,
            ...(redisKey && { redisKey }),
        });
    } catch (error) {
        customLog(null, 'error', {
            message: 'Pusher PG payment-confirmed trigger failed (scheduler)',
            credentialId,
            corporateTxnId,
            status,
            error: error?.message,
        });
    }
}

module.exports = { notifyPGPaymentConfirmed };
