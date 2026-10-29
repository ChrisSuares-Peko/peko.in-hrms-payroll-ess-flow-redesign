const express = require('express');
const { customLog } = require('../../../../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../../../../utils/checkAndFetchServiceDetails');
const operatorsData = require('../../../../utils/operatorsData.json');
const { completePaasReportFromWebhook } = require('../../../../controllers/corporate/carReportPaas');
const { completeInspectionFromWebhook } = require('../../../../controllers/corporate/carReportInspection');
const router = express.Router({ mergeParams: true });

// Shared-secret gate: x-webhook-key header vs the Droom vendor row's optional6
// (optional1-5 hold the challan credentials). Empty optional6 = check off.
router.use(async (req, res, next) => {
    try {
        const serviceOperator = await findServiceOperatorByAccessKey(operatorsData.carReport.accessKey);
        const secret = serviceOperator?.vendor?.optional6;
        if (!secret || req.headers['x-webhook-key'] === secret) return next();
    } catch (error) {
        // Fail open — a lookup blip must not drop a vendor callback.
        return next();
    }
    customLog(null, 'error', {
        message: 'Droom webhook rejected — missing or wrong x-webhook-key',
        path: req.path,
    });
    return res.status(401).json({ message: 'Unauthorized' });
});

// Droom pushes here when a PaaS (valuation PDF) report finishes. Payload shape is
// unconfirmed, so the full body is logged and the read-time poll covers a missed or
// unreadable call. Always 200s — a non-2xx would only invite a retry storm.
router.post('/valuation_callback', async (req, res) => {
    try {
        customLog(null, 'info', {
            message: 'Valuation callback received',
            body: req.body,
        });
        const outcome = await completePaasReportFromWebhook(req.body, req?.LogTraceId);
        if (!outcome.completed) {
            customLog(req?.LogTraceId, 'info', {
                message: 'Valuation callback did not complete an order',
                reason: outcome.reason,
                corporateTxnId: outcome.corporateTxnId,
            });
        }
        res.status(200).json({ message: 'Valuation callback received' });
    } catch (error) {
        customLog(error, 'error', {
            message: 'Error in valuation callback',
            error: error,
        });
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Droom pushes inspection status updates here (no order-status API for our account).
// Confirmed payload: { order_id, proposal_id, reason, comment, report_url: <base64 PDF> }.
// Matched by order_id; flipped READY only when the payload carries the report.
router.post('/inspection_callback', async (req, res) => {
    try {
        // The base64 PDF can run to megabytes — log a size marker instead.
        const loggedBody = { ...(req.body || {}) };
        if (typeof loggedBody.report_url === 'string' && loggedBody.report_url.length > 512) {
            loggedBody.report_url = `[base64 pdf, ${loggedBody.report_url.length} chars]`;
        }
        customLog(null, 'info', {
            message: 'Inspection callback received',
            body: loggedBody,
        });
        const outcome = await completeInspectionFromWebhook(req.body);
        if (!outcome.completed) {
            customLog(req?.LogTraceId, 'info', {
                message: 'Inspection callback did not complete an order',
                reason: outcome.reason,
                corporateTxnId: outcome.corporateTxnId,
            });
        }
        res.status(200).json({ message: 'Inspection callback received' });
    } catch (error) {
        customLog(error, 'error', {
            message: 'Error in inspection callback',
            error: error,
        });
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
