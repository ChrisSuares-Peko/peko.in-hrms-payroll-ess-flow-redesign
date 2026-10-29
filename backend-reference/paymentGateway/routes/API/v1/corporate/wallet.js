/* eslint-disable no-unused-vars */
'use strict'
const express = require('express')
const router = express.Router({ mergeParams: true })

const eSIM = require('../../../../controllers/corporate/eSIMV2');
const eSIMTunz = require('../../../../controllers/corporate/eSimTunz');
const hotel = require('../../../../controllers/corporate/hotels');
const { addonWalletPayment } = require('../../../../controllers/corporate/subscription');
const visa = require('../../../../controllers/corporate/visa');
const globalBusinessSetup = require('../../../../controllers/corporate/globalBusinessSetup');
const operatorData = require('../../../../utils/operatorsData.json');
const validateWalletAmount = require('../../../../middlewares/validateWalletPayment');
const { isServiceEnabled } = require('../../../../models/use-cases/disableService');
const { getValue, setValue } = require('../../../../utils/cacheDataMethods');
const { customLog } = require('../../../../utils/loggerHelper');

const paymentHandlers = {
  [operatorData.eSIM.accessKey]: eSIM.payment,
  [operatorData.eSIMTunz.accessKey]: eSIMTunz.payment,
  [operatorData.hotel.accessKey]: hotel.payment,
  [operatorData.eSIMTunz.accessKey]: eSIMTunz.payment,
  [operatorData.visa.accessKey]: visa.payment,
};

router.post('/payment', validateWalletAmount, async (req, res, next) => {
  try {
    const credentialId = req.user?.id;

    if (!credentialId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    // Multi-vendor path: orderGroups array present (mixed Bondio + Tunz purchase)
    if (Array.isArray(req.body.orderGroups)) {
      const groups = req.body.orderGroups;
      const { customLog } = require('../../../../utils/loggerHelper');

      // Check all conditions BEFORE processing any vendor
      // This prevents partial wallet deductions if one vendor fails

      for (const group of groups) {
        const enabled = await isServiceEnabled(credentialId, group.accessKey);
        if (!enabled) {
          customLog(req.LogTraceId, 'error', {
            message: 'Service disabled for mixed order',
            vendorAccessKey: group.accessKey,
            credentialId,
          });
          return res.status(403).json({
            status: false,
            message: `Service ${group.accessKey} is disabled for your account`,
          });
        }

        const handler = paymentHandlers[group.accessKey];
        if (!handler) {
          customLog(req.LogTraceId, 'error', {
            message: 'Invalid access key in mixed order',
            vendorAccessKey: group.accessKey,
          });
          return res.status(400).json({
            status: false,
            message: `Invalid access key: ${group.accessKey}`,
          });
        }

        // Validate orders and planIds exist
        if (!Array.isArray(group.orders) || !Array.isArray(group.planIds)) {
          customLog(req.LogTraceId, 'error', {
            message: 'Missing orders or planIds in mixed order group',
            vendorAccessKey: group.accessKey,
          });
          return res.status(400).json({
            status: false,
            message: `Invalid orders or planIds for ${group.accessKey}`,
          });
        }

        // Validate array lengths match
        if (group.orders.length !== group.planIds.length) {
          customLog(req.LogTraceId, 'error', {
            message: 'Orders and planIds length mismatch in mixed order',
            vendorAccessKey: group.accessKey,
            ordersLength: group.orders.length,
            planIdsLength: group.planIds.length,
          });
          return res.status(400).json({
            status: false,
            message: `Orders and planIds length mismatch for ${group.accessKey}`,
          });
        }
      }

      customLog(req.LogTraceId, 'info', {
        message: 'Mixed vendor pre-validation passed',
        vendorCount: groups.length,
        vendors: groups.map(g => g.accessKey),
      });


      // Now that all validations passed, process each vendor
      const parentBatchId = Date.now();
      const totalVendorGroups = groups.length;
      const results = [];
      const failedVendors = [];

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const isEsimTunz = group.accessKey === operatorData.eSIMTunz.accessKey;
        const processInternal = isEsimTunz
          ? eSIMTunz.processPaymentInternal
          : eSIM.processPaymentInternal;

        try {
          customLog(req.LogTraceId, 'info', {
            message: '[WALLET] Calling processPaymentInternal for multi-vendor',
            vendorIndex: i,
            vendorAccessKey: group.accessKey,
            isEsimTunz,
          });

          const result = await processInternal({
            credentialId,
            isSubCorporateUser: req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername,
            subCorporateUserId: req.user.subCorporateId,
            orders: group.orders,
            planIds: group.planIds,
            amount: group.amount,
            account: req.body.account,
            paymentGatewayResponse: req.body.paymentGatewayResponse,
            pgAmount: group.pgAmount,
            req,
            parentBatchId,
            totalVendorGroups,
            vendorIndex: i,
          });

          customLog(req.LogTraceId, 'info', {
            message: '[WALLET] Received result from processPaymentInternal',
            vendorIndex: i,
            vendorAccessKey: group.accessKey,
            resultSuccess: result.success,
            resultRedisKey: result.redisKey,
          });

          // ⚠️ EDGE CASE: One vendor fails after another succeeds
          if (!result.success) {
            customLog(req.LogTraceId, 'error', {
              message: 'Vendor payment processing failed in mixed order',
              vendorAccessKey: group.accessKey,
              vendorIndex: i + 1,
              totalVendors: groups.length,
              error: result.error,
              batchId: result.batchId,
            });
            failedVendors.push({
              vendor: group.accessKey,
              error: result.error,
              shouldRefundPG: result.shouldRefundPG,
              batchId: result.batchId,
            });
            continue; // Try next vendor, but track failure
          }

          results.push(result);
          customLog(req.LogTraceId, 'info', {
            message: 'Vendor payment processing succeeded in mixed order',
            vendorAccessKey: group.accessKey,
            vendorIndex: i + 1,
            totalVendors: groups.length,
            batchId: result.redisKey,
          });
        } catch (error) {
          // ⚠️ EDGE CASE: Network timeout, unexpected error
          customLog(req.LogTraceId, 'error', {
            message: 'Exception during vendor payment processing in mixed order',
            vendorAccessKey: group.accessKey,
            vendorIndex: i + 1,
            errorMessage: error?.message,
            errorStack: error?.stack,
          });
          failedVendors.push({
            vendor: group.accessKey,
            error: error?.message || 'Unknown error',
            isException: true,
          });
        }
      }

      if (failedVendors.length > 0) {
        const successfulVendors = results.map(r => r.vendor).filter(Boolean);

        customLog(req.LogTraceId, 'error', {
          message: 'Partial failure in mixed vendor payment',
          totalVendors: groups.length,
          successfulCount: results.length,
          failedCount: failedVendors.length,
          successfulVendors: groups.filter((_, i) => i < results.length).map(g => g.accessKey),
          failedVendors: failedVendors.map(f => f.vendor),
          parentBatchId,
        });

        // Check if any require PG refund
        const needsPGRefund = failedVendors.some(f => f.shouldRefundPG);

        return res.status(500).json({
          status: false,
          message: `Payment processing failed for ${failedVendors.map(f => f.vendor).join(', ')}`,
          responseCode: '001',
          data: {
            failureDetails: {
              successfulVendors: groups.filter((_, i) => i < results.length).map(g => g.accessKey),
              failedVendors: failedVendors,
              parentBatchId,
              requiresPGRefund: needsPGRefund,
            },
          },
        });
      }


      if (results.length === 0) {
        customLog(req.LogTraceId, 'error', {
          message: 'No results from vendor processing in mixed order',
          vendorCount: groups.length,
        });
        return res.status(500).json({
          status: false,
          message: 'Payment processing failed for all vendors',
        });
      }

      // For multi-vendor orders, merge all transaction data into a single Redis entry
      if (groups.length > 1) {
        const parentRedisKey = `esim:payment:${parentBatchId}`;
        let mergedTransactionData = [];
        const seen = new Set(); // Deduplicate by corporateTxnId

        try {
          // Fetch and merge data from all vendors (each stored under vendor-specific key)
          for (let i = 0; i < groups.length; i++) {
            const vendorRedisKey = `esim:payment:${parentBatchId}:vendor${i}`;
            const vendorData = await getValue(vendorRedisKey);

            if (vendorData) {
              const parsed = JSON.parse(vendorData);
              // Handle both array and single object responses
              const items = Array.isArray(parsed) ? parsed : [parsed];

              for (const item of items) {
                // Skip failed orders and duplicates (keep only successful ones)
                if (item?.status !== 'FAILURE' && !seen.has(item?.corporateTxnId)) {
                  mergedTransactionData.push(item);
                  seen.add(item?.corporateTxnId);
                }
              }
            }
          }

          // Store merged data under parentBatchId key (without vendor suffix)
          if (mergedTransactionData.length > 0) {
            await setValue(parentRedisKey, 60 * 5, JSON.stringify(mergedTransactionData));
            customLog(req.LogTraceId, 'info', {
              message: '[MIXED VENDOR] Merged transaction data stored in Redis',
              parentBatchId,
              totalTransactions: mergedTransactionData.length,
              parentRedisKey,
              vendorsProcessed: groups.length,
              skippedFailedOrders: (groups.length - mergedTransactionData.length),
            });
          }
        } catch (mergeErr) {
          customLog(req.LogTraceId, 'info', {
            message: '[MIXED VENDOR] Failed to merge transaction data (non-critical)',
            parentBatchId,
            error: mergeErr?.message,
          });
        }
      }

      // Calculate wallet deduction ONLY if all vendors succeeded
      const walletBalance = results[0].walletBalance;
      const totalDeducted = groups.reduce((sum, g) => sum + Number(g.amount) + Number(g.surcharge || 0), 0);
      const corporateFinalBalance = (walletBalance - totalDeducted).toFixed(2);

      customLog(req.LogTraceId, 'info', {
        message: 'Mixed vendor payment succeeded - all vendors processed',
        parentBatchId,
        totalVendors: groups.length,
        vendors: groups.map(g => g.accessKey),
        totalAmount: totalDeducted,
        walletBalance,
        finalBalance: corporateFinalBalance,
        resultsArray: results.map(r => ({ redisKey: r.redisKey, paymentMode: r.paymentMode })),
        bulkPaymentDataToBeSent: results.map(r => r.redisKey),
      });
      
      return res.status(200).json({
        status: true,
        message: "Payment started processing",
        responseCode: '000',
        data: {
          bulkPaymentData: results.map(r => r.redisKey),
          corporateFinalBalance,
          paymentMode: results[0].paymentMode,
          parentBatchId,
          processedVendors: groups.map(g => g.accessKey),
        },
      });
    }

    // Single-vendor path (existing logic)
    const operator = req.body.accessKey;

    customLog(req.LogTraceId, 'info', { message: '[WALLET] calling isServiceEnabled', operator, credentialId });
    const enabled = await isServiceEnabled(credentialId, operator);
    customLog(req.LogTraceId, 'info', { message: '[WALLET] isServiceEnabled returned', operator, enabled });

    if (!enabled) {
      return res.status(403).json({
        status: false,
        message: "This service is disabled for your account",
      });
    }

    if (operator === operatorData.globalBusinessSetup.accessKey) {
      if (req.body.isRenewalApproval) {
        await globalBusinessSetup.renewalApprove(req, res, next);
      } else {
        await globalBusinessSetup.payment(req, res, next);
      }
      return;
    }

    const handler = paymentHandlers[operator];

    if (!handler) {
      return res.status(400).json({
        status: false,
        message: "Invalid access key provided",
      });
    }

    await handler(req, res, next);

  } catch (error) {
    next(error);
  }
});

router.post('/addon-payment', addonWalletPayment);

module.exports = router