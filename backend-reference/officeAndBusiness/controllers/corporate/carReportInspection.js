/**
 * Droom dispatch for the Car Reports Inspection product (§5).
 *
 * An inspection is a doorstep booking, not a report: a technician has to be sent whether or
 * not the customer ever reopens the order. So unlike history — which is materialised lazily
 * on first read — this runs at payment time, and the read path is only a safety net for
 * orders the payment leg could not dispatch.
 *
 * Two legs create inspection orders. The wallet/PG leg (this service's own payment
 * controller) dispatches immediately. The Cashfree leg lives in paymentGateway, which has
 * no Droom client by design, so its orders arrive here undispatched and are sent the first
 * time the order is opened.
 *
 * `vendorReference` IS the dispatch marker: set only after a successful booking, so
 * `reportStatus = 'BOOKED' AND vendorReference IS NULL` means "paid for, not yet booked".
 * No extra column and no extra status code.
 */
const { bookInspection } = require('../../services/droomInspection');
const { joinDroomSlot, cleanReportUrl } = require('../../utils/carReport');
const { uploadPdfBuffer } = require('../../utils/commonUploadFile');
const { resolvePlanProductCode } = require('../../utils/carReportPlans');
const { refundWalletTransaction } = require('../../utils/walletTransaction');
const { publishStoredRefundJournal } = require('../../utils/carReportRefundJournal');
const { sendReportReadyEmail } = require('../../utils/carReportEmail');
const { customLog } = require('../../utils/loggerHelper');
const carReportOrder = require('../../models/entities/carReportOrder');

// Peko's own corporate identity as the booking client, which Droom wants alongside the end
// customer's details. The booking form does not collect this and the frontend's auth state
// does not carry it, so it is derived from the authenticated user.
//
// Isolated here on purpose: if Droom issues Peko a registered client identifier, or the
// values move to config, this is the only function that changes.
const buildClientIdentity = (req) => ({
    clientName: req.user?.corporateName || req.user?.name || 'Peko',
    clientSpocName: req.user?.name || '',
    clientSpocMobile: req.user?.mobile || req.user?.phone || '',
    clientSpocEmail: req.user?.email || req.user?.username || '',
});

// Droom rejected the booking outright, so the visit will never happen — give the money
// back.
//
// Gated on a conditional UPDATE rather than on having read BOOKED a moment ago: the payment
// leg and a concurrent read could otherwise both reach this branch and both refund. Only
// the call that actually flips the row refunds. (refundWalletTransaction has its own
// ALREADY REFUNDED guard, but that is a backstop, not the mechanism.)
const cancelAndRefund = async (row, req, reason) => {
    const [affected] = await carReportOrder.update(
        { reportStatus: 'CANCELLED' },
        { where: { id: row.id, reportStatus: 'BOOKED', vendorReference: null } }
    );
    if (!affected) return { ...row, reportStatus: 'CANCELLED' };

    customLog(
        req?.LogTraceId,
        'error',
        {
            message: 'Inspection refunded — Droom rejected the booking',
            corporateTxnId: row.corporateTxnId,
            vehicleNumber: row.vehicleNumber,
            reason,
        },
        'CAR_REPORT'
    );

    await refundWalletTransaction({
        corporateTxnId: row.corporateTxnId,
        status: 'FAILURE',
        providerId: row.corporateTxnId,
        message: 'Inspection booking could not be confirmed',
        registeredById: req.user?.registeredBy,
        orderResponse: JSON.stringify({ message: 'Inspection booking could not be confirmed' }),
    });
    await publishStoredRefundJournal({
        corporateTxnId: row.corporateTxnId,
        credentialId: row.credentialId,
        registeredBy: req.user?.registeredBy,
        logTraceId: req?.LogTraceId,
    });

    return { ...row, reportStatus: 'CANCELLED' };
};

/**
 * Books the technician visit with Droom, persists the outcome and returns the updated row.
 *
 * Always resolves — never throws. It runs inside a payment request (where the money is
 * already taken and the order already exists) and inside a GET (which must still render the
 * order). Callers use the returned row; they do not need to re-read.
 *
 * @param {object} row  a raw carReportOrder row, reportType 'inspection', vendorReference null
 * @param {object} req  for LogTraceId, the client identity, and registeredBy on the refund path
 */
exports.dispatchInspection = async (row, req) => {
    const form = row.formValues && typeof row.formValues === 'string'
        ? JSON.parse(row.formValues)
        : row.formValues || {};

    // Droom books by product_code; a package with none configured (admin panel) cannot
    // be dispatched — refund rather than book the wrong product.
    const productCode = await resolvePlanProductCode(form.packageId, req?.LogTraceId);
    if (!productCode) {
        return cancelAndRefund(row, req, `no vendor product code for package ${form.packageId}`);
    }

    let vendorResponse;
    try {
        vendorResponse = await bookInspection(
            {
                proposalNumber: row.corporateTxnId,
                make: form.make,
                model: form.model,
                year: form.manufacturingYear,
                trim: form.variant,
                customerName: form.contactName,
                // The booking form does not collect an email; the authenticated user's is
                // the only address we have to send Droom's confirmation to.
                customerEmail: req.user?.email || req.user?.username || '',
                customerAddress: form.fullAddress,
                customerCity: form.city,
                customerState: form.state,
                customerPincode: form.pincode,
                customerPhone: form.mobileNumber,
                slot1: joinDroomSlot(form.slot1Date, form.slot1Time),
                // '' when the customer picked only one slot — postDroomForm drops it.
                slot2: joinDroomSlot(form.slot2Date, form.slot2Time),
                registrationNumber: row.vehicleNumber,
                ...buildClientIdentity(req),
                inspectionCityName: form.city,
                vehicleType: row.bodyType || form.bodyType,
                productCode,
            },
            req?.LogTraceId
        );
    } catch (error) {
        const status = error?.response?.status;
        // Droom documents no error contract for §5 — not one non-200 example — so HTTP
        // semantics are the only signal available. A 4xx is the vendor refusing this
        // specific booking (bad payload, unserviceable city) and will never succeed on
        // retry; anything else is treated as transient.
        if (status >= 400 && status < 500) {
            return cancelAndRefund(row, req, `Droom returned ${status}`);
        }
        customLog(
            req?.LogTraceId,
            'error',
            {
                message: 'Droom inspection booking failed — leaving order undispatched',
                corporateTxnId: row.corporateTxnId,
                error: error?.response?.data || error.message,
            },
            'CAR_REPORT'
        );
        return row;
    }

    // Droom's own order id when it answered with one; our txn id otherwise. Either way
    // non-null = dispatched, and the webhook matches on both.
    const updates = {
        vendorReference: String(vendorResponse?.data?.order_id ?? row.corporateTxnId),
        vendorResponse: JSON.stringify(vendorResponse ?? null),
    };
    await carReportOrder.update(updates, { where: { id: row.id } });

    return { ...row, ...updates };
};

// `report_url` in the webhook carries the report PDF ITSELF, base64-encoded (vendor
// confirmed) — not a link. Decode it, verify it is a PDF, and host it on our own
// storage so the email button and the order page get a real URL. A plain https link
// is still accepted should the vendor ever switch. An upload failure throws — the
// route answers non-2xx and the vendor's retry re-delivers the PDF.
const resolveWebhookReportUrl = async (data, row) => {
    const raw = typeof data.report_url === 'string' ? data.report_url.trim() : '';
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return cleanReportUrl(raw);

    const pdf = Buffer.from(raw.replace(/^data:.*?;base64,/, ''), 'base64');
    if (pdf.subarray(0, 4).toString() !== '%PDF') {
        customLog(
            null,
            'error',
            { message: 'Inspection webhook report_url is not a PDF', corporateTxnId: row.corporateTxnId },
            'CAR_REPORT'
        );
        return null;
    }
    return uploadPdfBuffer(pdf, 'carReports/inspection');
};

// Inspection status webhook (Droom provides no order-status API for our account —
// updates are pushed here). Confirmed payload:
//   { order_id, proposal_id, reason, comment, report_url: <base64-encoded PDF> }
// Matched by order_id against our vendorReference (proposal_id is Droom's own
// numbering). Flips READY only when the payload carries the report.
exports.completeInspectionFromWebhook = async (body) => {
    if (!body || typeof body !== 'object') return { completed: false, reason: 'empty payload' };
    const data = body.data && typeof body.data === 'object' ? body.data : body;

    const vendorOrderId = data.order_id ?? data.order ?? null;
    if (vendorOrderId === null) return { completed: false, reason: 'no order reference in payload' };

    const row = await carReportOrder.findOne({
        where: { vendorReference: String(vendorOrderId), reportType: 'inspection' },
        raw: true,
    });
    if (!row) return { completed: false, reason: 'no matching inspection order' };

    const reportUrl = await resolveWebhookReportUrl(data, row);

    // Persist the payload without the base64 body — a PDF would blow up the column.
    const storedPayload = { ...data };
    if (typeof storedPayload.report_url === 'string' && storedPayload.report_url.length > 512) {
        storedPayload.report_url = `[base64 pdf, ${storedPayload.report_url.length} chars]`;
    }

    if (!reportUrl || row.reportStatus !== 'BOOKED') {
        // Progress-only update (technician assigned, QC…) — stored for later mapping.
        await carReportOrder.update(
            { vendorResponse: JSON.stringify(storedPayload) },
            { where: { id: row.id } }
        );
        return { completed: false, corporateTxnId: row.corporateTxnId };
    }

    // Conditional on BOOKED so a redelivered completion cannot double-email.
    const updates = {
        vendorResponse: JSON.stringify(storedPayload),
        reportUrl,
        reportStatus: 'READY',
    };
    const [affected] = await carReportOrder.update(updates, {
        where: { id: row.id, reportStatus: 'BOOKED' },
    });
    if (affected) await sendReportReadyEmail({ ...row, ...updates });

    return { completed: !!affected, corporateTxnId: row.corporateTxnId };
};

exports.buildClientIdentity = buildClientIdentity;
