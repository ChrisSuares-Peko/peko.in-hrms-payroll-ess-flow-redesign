const express = require('express');
const { Op } = require('sequelize');
const router = express.Router({mergeParams: true});
const { customLog } = require('../../../../utils/loggerHelper');
const order = require('../../../../models/entities/order');
const { getValue } = require('../../../../utils/cacheDataMethods');

/**
 * GET /bulk-payment/status/:batchId
 * Returns payment status for all transactions in a batch
 * Frontend polls this endpoint to get real-time transaction updates
 */
router.get('/status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        status: false,
        message: 'batchId is required',
        responseCode: '001',
        data: null,
      });
    }

    // Query all orders with this batchId
    // Owner check (F-PG-09): only the caller's own orders in the batch.
    const orders = await order.findAll({
      where: {
        batchId: String(batchId),
        credentialId: req.user.id,
      },
      attributes: ['status', 'corporateTxnId'],
      raw: true,
    });

    // Format response to match payment MS API structure
    // Convert corporateTxnId to number to match frontend type expectations
    const bulkPaymentStatus = orders.map(o => ({
      corporateTxnId: Number(o.corporateTxnId),
      status: o.status || 'PROCESSING',
    }));

    customLog(req?.LogTraceId, 'info', {
      message: '[BULK PAYMENT STATUS] Fetched status for batch',
      batchId,
      transactionCount: bulkPaymentStatus.length,
    });

    return res.status(200).json({
      status: true,
      message: 'Status Fetched Successfully',
      responseCode: '000',
      data: { bulkPaymentStatus },
    });
  } catch (error) {
    customLog(req?.LogTraceId, 'error', {
      message: '[BULK PAYMENT STATUS] Error fetching status',
      error: error?.message,
      batchId: req.params.batchId,
    });

    return res.status(500).json({
      status: false,
      message: 'Failed to fetch payment status',
      responseCode: '001',
      data: null,
    });
  }
});

router.get('/bulkPaymentData/:esimStoredBatchId', async (req, res) => {
  try {
    const redisKey = req.params.esimStoredBatchId.replace(/^"|"$/g, '');
    const notFound = () => res.status(404).json({
      status: false,
      message: 'Data not found in Redis',
      responseCode: '404',
    });

    // F-PG-10: only eSIM bulk-payment keys (esim:payment:<id>[:vendorN] / esim:payment:order:<id>[:vendorN])
    // may be read — never sessions, pricing or any other Redis key.
    if (!/^esim:payment:[A-Za-z0-9:_-]+$/.test(redisKey)) {
      return notFound();
    }

    const bulkPaymentDataString = await getValue(redisKey);

    if (!bulkPaymentDataString) {
      return notFound();
    }

    // The batch must belong to the caller: its orders carry the owner's credentialId.
    const parsedBulkData = JSON.parse(bulkPaymentDataString);
    const txnIds = (Array.isArray(parsedBulkData) ? parsedBulkData : [])
      .map((item) => item?.corporateTxnId)
      .filter(Boolean)
      .map(String);
    if (txnIds.length) {
      const foreignOrders = await order.count({
        where: { corporateTxnId: txnIds, credentialId: { [Op.ne]: req.user.id } },
      });
      if (foreignOrders > 0) {
        return notFound();
      }
    }

    customLog(req?.LogTraceId, 'info', {
      message: '[BULK PAYMENT DATA] Fetched esim bulk payment data',
      redisKey,
    });

    return res.status(200).json({
      status: true,
      message: 'Status Fetched Successfully',
      responseCode: '000',
      data: parsedBulkData,
    });
  } catch (error) {
    customLog(req?.LogTraceId, 'error', {
      message: '[BULK PAYMENT DATA] Error fetching bulk payment data',
      error: error?.message,
    });
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch bulk payment data',
      responseCode: '001',
    });
  }
});

module.exports = router;
