/**
 * Read-time materialisation for the Car Reports History product (Droom §4).
 *
 * Unlike valuation, nothing is fetched from the vendor before payment — the RC lookup IS
 * the report, so running it on the form would hand it over for free. The purchase records
 * a BUILDING order; the first time that order is opened, this module fetches the RC
 * details, persists them and flips the order to READY.
 *
 * Doing it here rather than inside the payment controller keeps every line of Droom code
 * in this service: the Cashfree leg lives in paymentGateway and creates its orders the
 * same way, so both payment routes converge on this one materialisation path.
 */
const {
    getVehicleRcDetails,
    getVehicleChallanDetails,
    getVehicleRcChallanReport,
} = require('../../services/droomHistory');
const { normaliseHistoryResult, summariseChallans, cleanReportUrl } = require('../../utils/carReport');
const { refundWalletTransaction } = require('../../utils/walletTransaction');
const { publishStoredRefundJournal } = require('../../utils/carReportRefundJournal');
const { sendReportReadyEmail } = require('../../utils/carReportEmail');
const { customLog } = require('../../utils/loggerHelper');
const carReportOrder = require('../../models/entities/carReportOrder');

// Droom documents no error contract — there is not one non-200 example in the whole
// reference — so "did a vehicle come back" is the only success test available.
const extractVehicle = (vendorResponse) => {
    if (!vendorResponse || typeof vendorResponse !== 'object') return null;
    if (vendorResponse.code && String(vendorResponse.code).toLowerCase() !== 'success') return null;
    return normaliseHistoryResult(vendorResponse.data);
};

// The plate is genuinely unresolvable: the customer paid for a report that cannot exist,
// so give the money back.
//
// The refund is gated on a conditional UPDATE rather than on having read status BUILDING
// a moment ago — two concurrent opens would otherwise both reach this branch and both
// refund. Only the call that actually flips the row does the refunding.
// (refundWalletTransaction has its own ALREADY REFUNDED guard, but that is a backstop,
// not the mechanism.)
const cancelAndRefund = async (row, req) => {
    const [affected] = await carReportOrder.update(
        { reportStatus: 'CANCELLED' },
        { where: { id: row.id, reportStatus: 'BUILDING' } }
    );
    if (!affected) return { ...row, reportStatus: 'CANCELLED' };

    customLog(
        req?.LogTraceId,
        'error',
        {
            message: 'History report refunded — Droom could not resolve the plate',
            corporateTxnId: row.corporateTxnId,
            vehicleNumber: row.vehicleNumber,
        },
        'CAR_REPORT'
    );

    await refundWalletTransaction({
        corporateTxnId: row.corporateTxnId,
        status: 'FAILURE',
        providerId: row.corporateTxnId,
        message: 'Vehicle history unavailable for this registration number',
        registeredById: req.user?.registeredBy,
        orderResponse: JSON.stringify({ message: 'Vehicle history unavailable' }),
    });
    await publishStoredRefundJournal({
        corporateTxnId: row.corporateTxnId,
        credentialId: row.credentialId,
        registeredBy: req.user?.registeredBy,
        logTraceId: req?.LogTraceId,
    });

    return { ...row, reportStatus: 'CANCELLED' };
};

// Vendor PDF link for the header download (`data.report_path` carries a full URL).
// Returns the value to store: the URL, '' when the vendor definitively has none (stops
// re-billing the lookup), or null on a transient/auth failure (next open retries).
const fetchHistoryPdfValue = async (row, req) => {
    let response;
    try {
        response = await getVehicleRcChallanReport(row.vehicleNumber, req?.LogTraceId);
    } catch (error) {
        customLog(
            req?.LogTraceId,
            'info',
            {
                message: 'History PDF fetch failed — retrying on next open',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
        return null;
    }

    if (response && String(response.code || '').toLowerCase() === 'success') {
        return cleanReportUrl(response.data?.report_path);
    }
    // Droom answers auth problems as 200/"failed" — that is transient, not "no PDF".
    if (/authori[sz]ation/i.test(String(response?.message || ''))) return null;
    return '';
};

// Read-time retry for a READY order whose PDF fetch failed during materialisation.
exports.attachHistoryReportPdf = async (row, req) => {
    const reportUrl = await fetchHistoryPdfValue(row, req);
    if (reportUrl === null) return row;
    await carReportOrder.update({ reportUrl }, { where: { id: row.id } });
    return { ...row, reportUrl };
};

/**
 * Fetches, persists and returns the completed history order.
 *
 * Always resolves to a row — never throws — because it runs inside a GET that must still
 * render the order even when the vendor is down. A transient failure leaves the order
 * BUILDING so the next open retries; only a genuinely unresolvable plate cancels.
 *
 * @param {object} row   a raw carReportOrder row with reportType 'history', status BUILDING
 * @param {object} req   for LogTraceId and req.user.registeredBy on the refund path
 */
exports.materialiseHistoryReport = async (row, req) => {
    let vendorResponse;
    try {
        vendorResponse = await getVehicleRcDetails(row.vehicleNumber, req?.LogTraceId);
    } catch (error) {
        // Vendor down, token rejected, network blip — recoverable. Leave the order
        // BUILDING and let the next open try again rather than cancelling a report the
        // customer may well still get.
        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'Droom RC lookup failed — leaving history order BUILDING',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
        return row;
    }

    const historyResult = extractVehicle(vendorResponse);
    if (!historyResult) {
        // Refund only on the vendor's explicit no-data verdict. Droom answers auth
        // problems as 200/"failed" too — refunding those would cancel a report for a
        // perfectly resolvable plate, so anything else stays BUILDING and retries.
        const code = String(vendorResponse?.code || '').toLowerCase();
        const noData = /data not found/i.test(String(vendorResponse?.message || ''));
        if (code === 'success' || noData) return cancelAndRefund(row, req);

        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'Droom RC lookup failed non-definitively — leaving history order BUILDING',
                corporateTxnId: row.corporateTxnId,
                vendorResponse,
            },
            'CAR_REPORT'
        );
        return row;
    }

    // Challans come from a separate endpoint; an outage costs that one row, not the
    // report.
    try {
        const challanResponse = await getVehicleChallanDetails(row.vehicleNumber, req?.LogTraceId);
        const challans = summariseChallans(challanResponse);
        if (challans) historyResult.challans = challans;
    } catch (error) {
        customLog(
            req?.LogTraceId,
            'info',
            {
                message: 'Challan lookup failed — omitting the challans row',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
    }

    const updates = {
        historyResult,
        // Keep the raw body: Droom returns more than the reference doc names (chassis and
        // engine numbers, RC expiry, owner address), and a richer card later should not
        // need the report re-purchased.
        vendorResponse: JSON.stringify(vendorResponse),
        vendorReference: historyResult.registrationNumber || row.vehicleNumber || null,
        reportStatus: 'READY',
    };
    // Vendor PDF for the header download; null (transient failure) stays unset so the
    // read path retries.
    const reportUrl = await fetchHistoryPdfValue(row, req);
    if (reportUrl !== null) updates.reportUrl = reportUrl;
    // The order was recorded with the plate standing in for the model, because a history
    // purchase carries no make/model. Now we know the real one.
    if (historyResult.modelName) updates.vehicleModel = historyResult.modelName;
    if (historyResult.bodyType && !row.bodyType) updates.bodyType = historyResult.bodyType;

    // Conditional on BUILDING — the payment leg, a page open and the scheduler sweep can
    // race here, and only the caller that actually flips the row sends the email.
    const [affected] = await carReportOrder.update(updates, {
        where: { id: row.id, reportStatus: 'BUILDING' },
    });
    if (affected) await sendReportReadyEmail({ ...row, ...updates }, req?.LogTraceId);

    return { ...row, ...updates };
};
