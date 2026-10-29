'use strict';

const paymentGatewayOrders = require('../models/entities/paymentGatewayOrders');
const emailer = require('./emailer');
const { customLog } = require('./loggerHelper');
const { requestMswipeManualRefund } = require('./mswipeManualRefund');

exports.requestMswipeEarlyExitRefund = async ({ req, corporateTxnId, refundAmount, reason, serviceType, logTraceId }) => {
  const refundResult = await requestMswipeManualRefund({
    corporateTxnId,
    paymentBodyData: req.body.paymentGatewayResponse,
    refundAmount,
    credentialId: req.user?.id,
    customer: { name: req.user?.name, email: req.user?.email },
    serviceName: serviceType,
    reason,
    sendMail: ({ to, subject, html }) => emailer.email({ to, subject, body: html }),
    logTraceId,
  });

  if (corporateTxnId) {
    try {
      const paymentRefId = String(corporateTxnId);
      const existing = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
      let wrapper;
      try {
        const parsed = JSON.parse(existing?.paymentResponse || '{}');
        wrapper = Array.isArray(parsed) ? { mswipePaymentResponse: parsed } : parsed || {};
      } catch {
        wrapper = {};
      }
      wrapper.earlyExitRefund = {
        reason: reason || null,
        initiatedAt: new Date().toISOString(),
        refundStatus: refundResult.status ? 'INITIATED' : 'FAILED',
        refundAmount: Number(refundAmount) || 0,
        response: refundResult,
      };
      await paymentGatewayOrders.update({ paymentResponse: JSON.stringify(wrapper) }, { where: { paymentRefId } });
    } catch (writeError) {
      customLog(logTraceId, 'error', { action: 'refund:mswipeEarlyExitMarkerFailed', corporateTxnId, error: writeError?.message }, 'VENDOR');
    }
  }

  return refundResult;
};
