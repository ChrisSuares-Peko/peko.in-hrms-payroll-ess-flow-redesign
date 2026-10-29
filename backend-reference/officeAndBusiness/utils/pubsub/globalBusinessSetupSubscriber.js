// Google Pub/Sub subscriber for Global Business Setup events.
//
// Ported from AE `officeAndBusiness/utils/serviceBus/pekoStartEventReceiver.js`
// (which used Azure Service Bus). IN uses Google Pub/Sub for cross-service
// messaging (see `travel/utils/pubsubSubscriber.js` for the pattern).
//
// paymentGateway publishes both GBS event types to a single topic
// (`global-business-setup-events`). Each message payload carries an
// `event` discriminator that this subscriber switches on:
//   - `payment_paid`     → flip is_paid=true on Mongo cache
//   - `renewal_approved` → refresh renewal cache from Base93
//
// One topic + one subscription keeps the publisher/subscriber wiring trivial
// and matches the low-volume reality of GBS payment/renewal traffic.
// Invoked at app startup from app.js.

require('dotenv').config();
const axios = require('axios');
const { PubSub } = require('@google-cloud/pubsub');
const { customLog } = require('../loggerHelper');
const { upsertApplicationFromVendor } = require('../../models/use-cases/globalBusinessSetup/application');
const { upsertRenewalFromVendor } = require('../../models/use-cases/globalBusinessSetup/renewal');
const { findOne: findOneServiceOperator } = require('../../models/use-cases/serviceOperator');

const pubsub = new PubSub({ projectId: process.env.GOOGLE_PROJECT_ID });

const GBS_EVENTS_SUBSCRIPTION =
    process.env.SUBSCRIPTION_GLOBAL_BUSINESS_SETUP_EVENTS ||
    'global-business-setup-events-sub';

const accessKey = 'global_business_setup';

async function handlePaymentPaid(payload) {
    const {
        vendor_app_id: vendorAppId,
        reference_id: referenceId,
        user_id: userId,
    } = payload;

    if (!vendorAppId) {
        customLog(null, 'warn', {
            message: 'payment_paid message missing vendor_app_id; skipping',
            payload,
        });
        return;
    }

    await upsertApplicationFromVendor(
        { _id: vendorAppId, reference_id: referenceId, is_paid: true },
        referenceId,
        userId,
    );

    customLog(null, 'info', {
        message: 'payment_paid processed — is_paid flipped',
        vendor_app_id: vendorAppId,
        reference_id: referenceId,
    });
}

async function handleRenewalApproved(payload) {
    const {
        vendor_renewal_id: vendorRenewalId,
        reference_id: referenceId,
        user_id: userId,
    } = payload;

    if (!vendorRenewalId) {
        customLog(null, 'warn', {
            message: 'renewal_approved message missing vendor_renewal_id; skipping',
            payload,
        });
        return;
    }

    const op = await findOneServiceOperator({ accessKey });
    const apiUrl = op?.vendor?.apiUrl ? op.vendor.apiUrl + '/api/v1/user/external/agent' : undefined;
    const apiKey = op?.vendor?.optional1;
    if (!apiUrl || !apiKey) {
        customLog(null, 'error', {
            message: 'renewal_approved: Global Business Setup service operator missing apiUrl/apiKey',
        });
        return;
    }

    const resp = await axios.get(`${apiUrl}/renewals/${vendorRenewalId}`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    });
    const vendorDoc = resp?.data?.data || resp?.data;

    if (vendorDoc?._id) {
        await upsertRenewalFromVendor(vendorDoc, referenceId, userId);
        customLog(null, 'info', {
            message: 'renewal_approved processed — cache refreshed',
            vendor_renewal_id: vendorRenewalId,
            reference_id: referenceId,
        });
    } else {
        customLog(null, 'warn', {
            message: 'renewal_approved: Base93 detail fetch returned no doc',
            vendor_renewal_id: vendorRenewalId,
        });
    }
}

async function dispatchEvent(payload) {
    switch (payload?.event) {
        case 'payment_paid':
            return handlePaymentPaid(payload);
        case 'renewal_approved':
            return handleRenewalApproved(payload);
        default:
            customLog(null, 'warn', {
                message: 'Unknown GBS event type; dropping message',
                payload,
            });
            return undefined;
    }
}

function attachHandler() {
    const subscription = pubsub.subscription(GBS_EVENTS_SUBSCRIPTION);

    subscription.on('message', async (message) => {
        try {
            const payload = JSON.parse(message.data.toString()) || {};
            await dispatchEvent(payload);
            message.ack();
        } catch (error) {
            customLog(null, 'error', {
                message: 'Failed to process GBS event',
                error: error?.message,
                data: error?.response?.data,
            });
            // Don't ack — let Pub/Sub redeliver.
        }
    });

    subscription.on('error', (error) => {
        customLog(null, 'error', {
            message: 'GBS events subscription error',
            error: error?.message,
        });
    });

    customLog(null, 'info', {
        message: `Subscribed to GBS events subscription "${GBS_EVENTS_SUBSCRIPTION}"`,
    });
}

exports.globalBusinessSetupSubscriber = () => {
    attachHandler();
};
