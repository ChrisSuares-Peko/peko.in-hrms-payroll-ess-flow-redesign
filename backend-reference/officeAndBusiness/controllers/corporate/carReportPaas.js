// Droom PaaS report lifecycle for the Valuation product. The PDF is ordered right
// after payment and generated async on Droom's side; completion arrives via the
// webhook (routes/API/v1/webhook/droom.js) or the read-time status poll.
// `vendorReference` holds Droom's order id — NULL means "paid for, not yet ordered".
const { createPaasReport, getPaasReportStatus } = require('../../services/droomPaasReport');
const { getUsedPriceRange } = require('../../services/droomValuation');
const {
    buildPaasReportRequest,
    extractPaasReport,
    buildUsedPriceRequest,
    normalisePriceBands,
} = require('../../utils/carReport');
const { refundWalletTransaction } = require('../../utils/walletTransaction');
const { publishStoredRefundJournal } = require('../../utils/carReportRefundJournal');
const { sendReportReadyEmail } = require('../../utils/carReportEmail');
const { customLog } = require('../../utils/loggerHelper');
const carReportOrder = require('../../models/entities/carReportOrder');

// JSON column read with raw:true may come back parsed or as a string.
const toForm = (row) =>
    row.formValues && typeof row.formValues === 'string'
        ? JSON.parse(row.formValues)
        : row.formValues || {};

// Gated on a conditional UPDATE so concurrent callers can never double-refund.
const cancelAndRefund = async (row, req, reason) => {
    const [affected] = await carReportOrder.update(
        { reportStatus: 'CANCELLED' },
        { where: { id: row.id, reportStatus: 'BUILDING' } }
    );
    if (!affected) return { ...row, reportStatus: 'CANCELLED' };

    customLog(
        req?.LogTraceId,
        'error',
        {
            message: 'Valuation refunded — Droom could not produce the PaaS report',
            corporateTxnId: row.corporateTxnId,
            reason,
        },
        'CAR_REPORT'
    );

    await refundWalletTransaction({
        corporateTxnId: row.corporateTxnId,
        status: 'FAILURE',
        providerId: row.corporateTxnId,
        message: 'Valuation report could not be generated',
        registeredById: req.user?.registeredBy,
        orderResponse: JSON.stringify({ message: 'Valuation report could not be generated' }),
    });
    await publishStoredRefundJournal({
        corporateTxnId: row.corporateTxnId,
        credentialId: row.credentialId,
        registeredBy: req.user?.registeredBy,
        logTraceId: req?.LogTraceId,
    });

    return { ...row, reportStatus: 'CANCELLED' };
};

// Conditional on BUILDING so the webhook and a concurrent poll cannot both complete it
// — and only the caller that actually flipped the row sends the report-ready email.
const completeOrder = async (row, paas) => {
    const updates = {
        reportUrl: paas.reportUrl,
        reportPath: paas.reportPath || null,
        vendorResponse: JSON.stringify(paas.raw ?? null),
        reportStatus: 'READY',
    };
    const [affected] = await carReportOrder.update(updates, {
        where: { id: row.id, reportStatus: 'BUILDING' },
    });
    if (affected) await sendReportReadyEmail({ ...row, ...updates });
    return affected ? { ...row, ...updates } : row;
};

// Orders the PDF from Droom and stores the vendor order id. Never throws — runs inside
// the payment request and the detail GET.
const dispatchPaasReport = async (row, req) => {
    const form = toForm(row);

    let vendorResponse;
    try {
        vendorResponse = await createPaasReport(
            buildPaasReportRequest(form, req.user?.name || form.contactName || ''),
            req?.LogTraceId
        );
    } catch (error) {
        const status = error?.response?.status;
        // 4xx = vendor refused this spec, will never succeed on retry; else transient.
        if (status >= 400 && status < 500) {
            return cancelAndRefund(row, req, `Droom returned ${status}`);
        }
        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'Droom PaaS report create failed — leaving order unordered',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
        return row;
    }

    const paas = extractPaasReport(vendorResponse);
    if (!paas) {
        // 2xx with no order id — nothing to poll, but refunding on an ambiguous body
        // would be worse. The read path re-orders.
        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'Droom PaaS create returned no order id — leaving order unordered',
                corporateTxnId: row.corporateTxnId,
                vendorResponse,
            },
            'CAR_REPORT'
        );
        return row;
    }

    const updates = {
        vendorReference: paas.orderId,
        vendorResponse: JSON.stringify(vendorResponse ?? null),
    };
    await carReportOrder.update(updates, { where: { id: row.id } });

    return { ...row, ...updates };
};

// Polls Droom for an ordered-but-pending report. Never throws.
const refreshPaasReport = async (row, req) => {
    let vendorResponse;
    try {
        vendorResponse = await getPaasReportStatus(row.vendorReference, req?.LogTraceId);
    } catch (error) {
        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'Droom PaaS status poll failed — leaving order BUILDING',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
        return row;
    }

    const paas = extractPaasReport(vendorResponse);
    if (paas && paas.status === 'completed' && paas.reportUrl) {
        return completeOrder(row, { ...paas, raw: vendorResponse });
    }
    if (paas && paas.status === 'failed') {
        return cancelAndRefund(row, req, 'Droom PaaS report status = failed');
    }
    return row;
};

// Read-time entry point for a BUILDING valuation: re-orders if the payment leg never
// managed to, polls for completion otherwise.
exports.materialisePaasReport = async (row, req) => {
    if (!row.vendorReference) return dispatchPaasReport(row, req);
    return refreshPaasReport(row, req);
};

// Fills the Fair Market Value band chips on first open of a READY order. A vendor
// "cannot price" answer is stored as [] so the lookup is never re-bought; an outage
// leaves the column null to retry. Never throws.
exports.fetchValuationBands = async (row, req) => {
    const form = toForm(row);

    let vendorResponse;
    try {
        vendorResponse = await getUsedPriceRange(buildUsedPriceRequest(form), req?.LogTraceId);
    } catch (error) {
        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'OBV price-range lookup failed — leaving bands absent',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
        return row;
    }

    const bands = normalisePriceBands(vendorResponse);
    if (!bands.length) {
        customLog(
            req?.LogTraceId,
            'info',
            {
                message: 'OBV returned no usable price bands for this spec',
                corporateTxnId: row.corporateTxnId,
                vendorResponse,
            },
            'CAR_REPORT'
        );
    }

    await carReportOrder.update({ valuationBands: bands }, { where: { id: row.id } });
    return { ...row, valuationBands: bands };
};

// Webhook completion. Payload shape is unconfirmed, so it is treated as a "check now"
// signal — a payload without a report URL falls back to the status endpoint. Never
// throws; duplicate deliveries are no-ops via completeOrder's conditional update.
exports.completePaasReportFromWebhook = async (body, logTraceId = null) => {
    const paas =
        extractPaasReport(body) ||
        extractPaasReport({ code: 'success', data: body && typeof body === 'object' ? body : {} });
    if (!paas) return { completed: false, reason: 'no order id in payload' };

    const row = await carReportOrder.findOne({
        where: { vendorReference: paas.orderId, reportType: 'valuation' },
        raw: true,
    });
    if (!row) return { completed: false, reason: `no order for vendor id ${paas.orderId}` };
    if (row.reportStatus !== 'BUILDING') return { completed: false, reason: 'already settled' };

    if (paas.reportUrl) {
        await completeOrder(row, { ...paas, raw: body });
        return { completed: true, corporateTxnId: row.corporateTxnId };
    }

    const refreshed = await refreshPaasReport(row, { LogTraceId: logTraceId });
    return {
        completed: refreshed.reportStatus === 'READY',
        corporateTxnId: row.corporateTxnId,
    };
};

exports.dispatchPaasReport = dispatchPaasReport;
