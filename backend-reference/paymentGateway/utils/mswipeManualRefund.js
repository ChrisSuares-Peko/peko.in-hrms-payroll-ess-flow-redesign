'use strict';

const sequelize = require('../configs/database/index');
const operatorsData = require('./operatorsData.json');
const { customLog } = require('./loggerHelper');
const { formatNumberWithLocalString } = require('./formatter');

const PROVIDER = operatorsData.mswipePaymentGateway.accessKey;
const REFUND_OPS_SETTING = 'mswipeRefundOps';
const FALLBACK_OPS_SETTING = 'pekoWebsite';

const RECORD_UPSERT = `INSERT INTO manualRefunds
    (corporateTxnId, orderId, paymentGatewayOrderId, pgProvider, status, refundAmount, paidAmount, credentialId,
     serviceName, reason, gatewayOrderId, gatewayReference, paymentDetails, history, createdAt, updatedAt)
  VALUES
    (:corporateTxnId, :orderId, :paymentGatewayOrderId, :pgProvider, 'PENDING', :refundAmount, :paidAmount, :credentialId,
     :serviceName, :reason, :gatewayOrderId, :gatewayReference, :paymentDetails, JSON_ARRAY(CAST(:historyEntry AS JSON)), NOW(), NOW())
  ON DUPLICATE KEY UPDATE
    orderId = IF(status = 'FAILED', COALESCE(orderId, :orderId), orderId),
    paymentGatewayOrderId = IF(status = 'FAILED', COALESCE(paymentGatewayOrderId, :paymentGatewayOrderId), paymentGatewayOrderId),
    refundAmount = IF(status = 'FAILED', :refundAmount, refundAmount),
    reason = IF(status = 'FAILED', :reason, reason),
    history = IF(status = 'FAILED', JSON_ARRAY_APPEND(COALESCE(history, JSON_ARRAY()), '$', CAST(:historyEntry AS JSON)), history),
    updatedAt = IF(status = 'FAILED', NOW(), updatedAt),
    status = IF(status = 'FAILED', 'PENDING', status)`;

const ORDER_CONTEXT = `SELECT o.id AS orderId, o.credentialId, c.name AS customerName, c.email AS customerEmail,
    so.serviceProvider AS serviceName
  FROM orders o
  LEFT JOIN credentials c ON c.id = o.credentialId
  LEFT JOIN serviceOperators so ON so.id = o.serviceOperatorId
  WHERE o.corporateTxnId = :corporateTxnId
  LIMIT 1`;

const PAYMENT_GATEWAY_ORDER = 'SELECT id FROM paymentGatewayOrders WHERE paymentRefId = :paymentRefId ORDER BY id DESC LIMIT 1';

const firstEntry = (value) => (Array.isArray(value) ? value[0] : value);

const isMswipePayment = (paymentResponse) =>
  [paymentResponse, paymentResponse?.pgResponse].some((candidate) => firstEntry(candidate)?.gateway === PROVIDER);

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const toEmailList = (emails) =>
  (Array.isArray(emails) ? emails : String(emails ?? '').split(','))
    .map((email) => String(email ?? '').trim())
    .filter(Boolean);

const settingEmails = async (name) => {
  const rows = await sequelize.query('SELECT details FROM settings WHERE name = :name LIMIT 1', {
    replacements: { name },
    type: sequelize.QueryTypes.SELECT,
  });
  let details = rows[0]?.details;
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch {
      details = null;
    }
  }
  return toEmailList(details?.emails);
};

const opsMailHtml = (rows) => `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111827;font-size:14px;line-height:1.6;">
    <p style="margin:0 0 16px;">A payment made through Mswipe needs a refund. Mswipe has no refund API, so please raise this refund with Mswipe and then update its status in Admin &rarr; Manage &rarr; Mswipe Refunds.</p>
    <table cellpadding="8" cellspacing="0" role="presentation" style="border-collapse:collapse;border:1px solid #E5E7EB;">
      ${rows
        .map(([label, value]) => `<tr><td style="border:1px solid #E5E7EB;font-weight:600;background:#F9FAFB;">${escapeHtml(label)}</td><td style="border:1px solid #E5E7EB;">${escapeHtml(value ?? '-')}</td></tr>`)
        .join('\n      ')}
    </table>
  </body>
</html>`;

const requestMswipeManualRefund = async ({
  corporateTxnId,
  paymentBodyData,
  refundAmount,
  credentialId,
  customer = {},
  serviceName,
  reason,
  saveOrder,
  sendMail,
  notifyCustomer,
  logTraceId,
}) => {
  const payment = firstEntry(paymentBodyData?.pgResponse ?? paymentBodyData) || {};
  const details = payment.gatewayDetails || {};
  const amount = Number(refundAmount ?? payment.payment_amount);
  if (!corporateTxnId || !Number.isFinite(amount) || amount <= 0) {
    customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundInvalid', corporateTxnId, refundAmount }, 'VENDOR');
    return { status: false, message: 'Invalid refund amount' };
  }

  const txnId = String(corporateTxnId);
  const gatewayReference = payment.bank_reference ?? details.rrn ?? null;

  let context = {};
  let paymentGatewayOrderId = null;
  try {
    [context = {}] = await sequelize.query(ORDER_CONTEXT, {
      replacements: { corporateTxnId: txnId },
      type: sequelize.QueryTypes.SELECT,
    });
    const [paymentGatewayOrder] = await sequelize.query(PAYMENT_GATEWAY_ORDER, {
      replacements: { paymentRefId: String(payment.order_id ?? txnId) },
      type: sequelize.QueryTypes.SELECT,
    });
    paymentGatewayOrderId = paymentGatewayOrder?.id ?? null;
  } catch (error) {
    customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundContextFailed', corporateTxnId: txnId, error: error?.message ?? error }, 'VENDOR');
  }
  const customerName = customer.name ?? context.customerName ?? null;
  const customerEmail = customer.email ?? context.customerEmail ?? null;
  const service = serviceName ?? context.serviceName ?? null;

  let affectedRows;
  try {
    [, affectedRows] = await sequelize.query(RECORD_UPSERT, {
      replacements: {
        corporateTxnId: txnId,
        orderId: context.orderId ?? null,
        paymentGatewayOrderId,
        pgProvider: PROVIDER,
        refundAmount: amount,
        paidAmount: payment.payment_amount == null || !Number.isFinite(Number(payment.payment_amount))
          ? null
          : Number(payment.payment_amount),
        credentialId: credentialId ?? context.credentialId ?? null,
        serviceName: service,
        reason: reason ?? null,
        gatewayOrderId: details.providerOrderId ?? null,
        gatewayReference,
        paymentDetails: JSON.stringify({
          paymentTime: payment.payment_time ?? null,
          paymentGroup: payment.payment_group ?? null,
          mid: details.mid ?? null,
          tid: details.tid ?? null,
          rrn: details.rrn ?? null,
          reference: details.reference ?? null,
          paymentType: details.paymentType ?? null,
          cardType: details.cardType ?? null,
        }),
        historyEntry: JSON.stringify({ status: 'PENDING', at: new Date().toISOString() }),
      },
      type: sequelize.QueryTypes.INSERT,
    });
  } catch (error) {
    customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundFailed', corporateTxnId: txnId, error: error?.message ?? error }, 'VENDOR');
    return { status: false, message: 'Something went wrong' };
  }

  if (!affectedRows) {
    let existingStatus;
    try {
      const [existing] = await sequelize.query('SELECT status FROM manualRefunds WHERE corporateTxnId = :corporateTxnId', {
        replacements: { corporateTxnId: txnId },
        type: sequelize.QueryTypes.SELECT,
      });
      existingStatus = existing?.status;
    } catch (error) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundStatusLookupFailed', corporateTxnId: txnId, error: error?.message ?? error }, 'VENDOR');
    }
    customLog(logTraceId, 'info', { action: 'refund:mswipeManualRefundAlreadyRequested', corporateTxnId: txnId, status: existingStatus }, 'VENDOR');
    return { status: true, message: 'Refund already initiated', refundStatus: existingStatus };
  }

  if (saveOrder) {
    const refund = {
      gateway: PROVIDER,
      refund_id: `refund_${txnId}`,
      refund_amount: amount,
      refund_status: 'PENDING',
      refund_mode: 'MANUAL',
      created_at: new Date().toISOString(),
    };
    try {
      await saveOrder({
        paymentModeResponse: JSON.stringify({ ...paymentBodyData, refundStatus: 'PENDING', refundResults: [refund] }),
      });
    } catch (error) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundOrderUpdateFailed', corporateTxnId: txnId, error: error?.message ?? error }, 'VENDOR');
    }
  }

  try {
    let to = await settingEmails(REFUND_OPS_SETTING);
    if (!to.length) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeRefundOpsListMissing', setting: REFUND_OPS_SETTING, corporateTxnId: txnId }, 'VENDOR');
      to = await settingEmails(FALLBACK_OPS_SETTING);
    }
    if (to.length) {
      await sendMail({
        to,
        subject: `Mswipe refund needed for transaction ${txnId}`,
        html: opsMailHtml([
          ['Transaction ID', txnId],
          ['Refund amount', `₹ ${formatNumberWithLocalString(amount)}`],
          ['Amount paid', payment.payment_amount == null ? null : `₹ ${formatNumberWithLocalString(payment.payment_amount)}`],
          ['Paid on', payment.payment_time],
          ['Mswipe IPG ID', details.providerOrderId],
          ['RRN', gatewayReference],
          ['MID', details.mid],
          ['TID', details.tid],
          ['Payment method', payment.payment_group],
          ['Customer', customerName],
          ['Customer email', customerEmail],
          ['Service', service],
          ['Reason', reason],
        ]),
      });
    } else {
      customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundMailSkipped', corporateTxnId: txnId }, 'VENDOR');
    }
  } catch (error) {
    customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundMailFailed', corporateTxnId: txnId, error: error?.message ?? error }, 'VENDOR');
  }

  if (notifyCustomer) {
    try {
      await notifyCustomer();
    } catch (error) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeManualRefundCustomerMailFailed', corporateTxnId: txnId, error: error?.message ?? error }, 'VENDOR');
    }
  }

  customLog(logTraceId, 'info', { action: 'refund:mswipeManualRefundRequested', corporateTxnId: txnId, refundAmount: amount, reopened: affectedRows === 2 }, 'VENDOR');
  return { status: true, refundStatus: 'PENDING', message: 'Refund initiated' };
};

module.exports = {
  isMswipePayment,
  requestMswipeManualRefund,
};
