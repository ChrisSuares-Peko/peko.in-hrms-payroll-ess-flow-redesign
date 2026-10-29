// Google Pub/Sub publisher for Global Business Setup events.
//
// Mirrors AE gateway's `sendPekoStartPaymentPaid` / `sendPekoStartRenewalApproved`
// helpers, but uses GCP Pub/Sub (IN's preferred messaging primitive — see
// `travel/utils/pubsubSubscriber.js` and `paymentGateway/controllers/corporate/hotels.js`)
// instead of Azure Service Bus.
//
// Both GBS events flow through a SINGLE topic with an `event` discriminator
// inside the payload. The subscriber (officeAndBusiness) switches on
// `payload.event` to route. One topic + one subscription keeps GCP ops simple
// without coupling to the hotels TOPIC_NAME (different payload shape, different
// retention needs).
//
// Topic:
//   - `global-business-setup-events`
// Events (set in payload.event):
//   - `payment_paid`     → flip is_paid=true on cached application
//   - `renewal_approved` → refresh renewal cache from Base93

const { PubSub } = require('@google-cloud/pubsub');
const { customLog } = require('../loggerHelper');

const pubsub = new PubSub();

const GBS_EVENTS_TOPIC =
    process.env.TOPIC_GLOBAL_BUSINESS_SETUP_EVENTS ||
    'global-business-setup-events';

async function publish(payload, traceId) {
    try {
        const dataBuffer = Buffer.from(JSON.stringify(payload));
        const messageId = await pubsub
            .topic(GBS_EVENTS_TOPIC)
            .publishMessage({ data: dataBuffer });
        customLog(traceId, 'info', {
            message: 'Pub/Sub message published',
            topic: GBS_EVENTS_TOPIC,
            messageId,
            payload,
        });
        return messageId;
    } catch (err) {
        customLog(traceId, 'error', {
            message: 'Failed to publish Pub/Sub message',
            topic: GBS_EVENTS_TOPIC,
            error: err?.message,
            payload,
        });
        // Don't throw — payment/Base93 calls have already succeeded by the
        // time we publish. Failure here means the cache flag won't flip until
        // the next reconcile fetch — recoverable, not a payment failure.
    }
}

exports.publishPaymentPaid = async ({ vendor_app_id, reference_id, user_id }, traceId) =>
    publish(
        { event: 'payment_paid', vendor_app_id, reference_id, user_id },
        traceId,
    );

exports.publishRenewalApproved = async (
    { vendor_renewal_id, reference_id, user_id },
    traceId,
) =>
    publish(
        { event: 'renewal_approved', vendor_renewal_id, reference_id, user_id },
        traceId,
    );
