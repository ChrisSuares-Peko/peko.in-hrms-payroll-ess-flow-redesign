'use strict';

const emailer = require('./emailer');
const { customLog } = require('./loggerHelper');
const { formatNumberWithLocalString } = require('./formatter');
const { partnerLogos } = require('./partnerLogos');
const { createNotification } = require('../models/use-cases/notification');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { resolveEmailTemplate } = require('../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('./emailTemplateKeys');
const { v2LayoutVariables } = require('./emailTemplate/sharedLayout');
const { manualRefundStatusUpdate } = require('./emailTemplates/common');

const CUSTOMER_MESSAGES = {
  IN_PROGRESS: {
    key: EMAIL_TEMPLATE_KEYS.REFUND_IN_PROGRESS,
    title: 'Refund in progress',
    heading: 'Your refund is in progress',
    badge: null,
    brief: ({ amount, transactionId }) => `Your refund of ₹${amount} for transaction ${transactionId} is being processed.`,
    paragraphs: ({ amount, transactionId }) => [
      `We have started processing the refund of ₹ ${amount} for transaction ${transactionId}.`,
      'We will let you know as soon as it is completed.',
    ],
  },
  SUCCESS: {
    key: EMAIL_TEMPLATE_KEYS.REFUND_COMPLETED,
    title: 'Refund successful',
    heading: 'Your refund is complete',
    badge: 'success',
    brief: ({ amount, transactionId, refundReference }) =>
      `₹${amount} for transaction ${transactionId} has been refunded to your original payment method. Reference: ${refundReference}.`,
    paragraphs: ({ amount, transactionId, refundReference }) => [
      `The refund of ₹ ${amount} for transaction ${transactionId} has been processed to your original payment method. It may take up to 7 working days to reflect, depending on your bank.`,
      `Refund reference: ${refundReference}`,
    ],
  },
  FAILED: {
    key: EMAIL_TEMPLATE_KEYS.REFUND_REJECTED,
    title: 'Refund could not be completed',
    heading: "We couldn't complete your refund",
    badge: 'reject',
    brief: ({ amount, transactionId }) =>
      `We couldn't complete the refund of ₹${amount} for transaction ${transactionId}. Our support team will contact you.`,
    paragraphs: ({ amount, transactionId }) => [
      `We were unable to complete the refund of ₹ ${amount} for transaction ${transactionId}.`,
      'Our support team will contact you shortly to resolve this.',
    ],
  },
};

exports.notifyManualRefundStatus = async ({ corporateTxnId, status, refundAmount, refundReference, customer, logTraceId }) => {
  const message = CUSTOMER_MESSAGES[status];
  if (!message || !customer) return;

  const params = {
    amount: formatNumberWithLocalString(refundAmount),
    transactionId: corporateTxnId,
    refundReference,
  };

  if (customer.username) {
    try {
      await createNotification({
        notificationTitle: message.title,
        notificationBrief: message.brief(params),
        notificationTo: [customer.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
      });
    } catch (error) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundNotificationFailed', corporateTxnId, status, error: error?.message ?? error });
    }
  }

  if (customer.email) {
    try {
      const partnerData = customer.registeredBy ? await fetchPartnerDetails(customer.registeredBy) : await partnerLogos();
      const name = customer.name || customer.username || 'Customer';
      const resolved = await resolveEmailTemplate({
        key: message.key,
        service: EMAIL_TEMPLATE_SERVICES.REFUND,
        variables: {
          name,
          amount: params.amount,
          transactionId: corporateTxnId,
          refundReference: refundReference || '',
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.baseUrl || 'https://peko.one/in',
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => manualRefundStatusUpdate({
          name,
          heading: message.heading,
          paragraphs: message.paragraphs(params),
          badge: message.badge,
        }, partnerData),
        fallbackSubject: message.title,
        partnerId: customer.registeredBy ?? null,
        logTraceId,
      });
      await emailer.email({ to: customer.email, subject: resolved.subject, body: resolved.html });
    } catch (error) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundCustomerMailFailed', corporateTxnId, status, error: error?.message ?? error });
    }
  }
};
