const { Op } = require('sequelize');
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/pamentGatewayTransaction');
const { refundGatewayTransaction } = require('./pluralGateway');
const { customLog } = require('../../utils/loggerHelper');
const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middlewares/async');
const operatorsData = require('../../utils/operatorsData.json');
const emailer = require('../../utils/emailer');
const { commonFailedTemplateforBillPayments } = require('../../utils/emailTemplates/billpayments');
const { generateCarReportPaymentSuccessEmail } = require('../../utils/emailTemplates/carReportPayment');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const { createNotification } = require('../../models/use-cases/notification');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const wallet = require('../../models/entities/wallet');
const order = require('../../models/entities/order');
const carReportOrder = require('../../models/entities/carReportOrder');
const {
    REPORT_STATUS_LABELS,
    isPurchasable,
    missingRequiredFields,
    buildVehicleModel,
    buildValuationSpec,
    buildInspectionBooking,
    initialReportStatus,
    buildProgressSteps,
} = require('../../utils/carReport');
const { resolvePlanPrice, getActivePlans } = require('../../utils/carReportPlans');
const { materialiseHistoryReport, attachHistoryReportPdf } = require('./carReportHistory');
const { dispatchInspection } = require('./carReportInspection');
const { dispatchPaasReport, materialisePaasReport, fetchValuationBands } = require('./carReportPaas');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { findOneOrder } = require('../../models/use-cases/order');

const accessKey = operatorsData.carReport.accessKey;
const transactionCategory = operatorsData.carReport.type;

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// A payment that failed or was refunded is not a live report, whatever the report
// pipeline thinks — payment state wins.
const PAYMENT_STATUS_OVERRIDES = {
    FAILURE: 'Failed',
    FAILED: 'Failed',
    REFUND: 'Cancelled',
    REFUNDED: 'Cancelled',
};

const resolveDisplayStatus = (paymentStatus, reportStatus) => {
    // A cancelled report was auto-refunded — 'Cancelled' reads truer than the payment
    // row's FAILURE marker (bug 30152: "paid but shows Failed").
    if (reportStatus === 'CANCELLED') return REPORT_STATUS_LABELS.CANCELLED;
    return (
        PAYMENT_STATUS_OVERRIDES[(paymentStatus || '').toUpperCase()] ||
        REPORT_STATUS_LABELS[reportStatus] ||
        'Building'
    );
};

// The DB holds 'WALLET'; the UI shows 'Wallet'.
const toTitleCase = (value) =>
    (value || '')
        .toString()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

// Search text is interpolated into LIKE over a utf8 (3-byte) connection, so 4-byte characters
// (emoji) make MySQL reject the query. Drop them plus the zero-width joiners / variation selectors
// that travel with them (ticket 31006); same rule as the garage controller.
const stripUnsearchable = (value) => value.replace(/[\u{10000}-\u{10FFFF}]|\u200D|\uFE0E|\uFE0F/gu, '');

// LIKE metacharacters in user input would otherwise turn a search for "50%" into a
// wildcard that matches everything.
const escapeLike = (value) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

// A JSON column read with raw:true may come back parsed or as a string; normalise.
const toJson = (value, fallback) => {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch (e) {
        return fallback;
    }
};

// Surcharge, in the two-call form this service uses everywhere (see domainAndHosting and
// attestation). The `|| 'FLAT'` default is load-bearing: calculateSurcharge returns 0 for
// an unrecognised type, so a serviceOperator row with a null surchargeType would silently
// waive the convenience fee.
const resolveConvenienceFee = async (serviceDetails, amount, credentialId) => {
    const surchargeWithoutTax = await calculateSurcharge(
        serviceDetails.surcharge,
        serviceDetails.surchargeType || 'FLAT',
        amount,
        credentialId
    );
    return Number(await calculateAmountWithTax(surchargeWithoutTax)) || 0;
};

// Shapes one row into the frontend's ReportOrderDetail (vehicleReports/types/index.ts).
const toOrderDetail = (row, paymentStatus, paymentMode) => {
    const status = resolveDisplayStatus(paymentStatus, row.reportStatus);
    const detail = {
        orderId: row.corporateTxnId,
        reportType: row.reportType,
        reportName: row.reportName,
        vehicleNumber: row.vehicleNumber || '',
        vehicleModel: row.vehicleModel || '',
        orderDate: row.orderDate ? new Date(row.orderDate).toISOString().split('T')[0] : '',
        amount: Number(row.amount) || 0,
        status,
        paymentMode: toTitleCase(row.paymentMode || paymentMode) || 'Wallet',
        steps: buildProgressSteps(row.reportType, row.reportStatus),
    };
    if (row.bodyType) detail.bodyType = row.bodyType;
    // The header download button — vendor PDF, present for valuation and history.
    if (row.reportUrl) detail.reportUrl = row.reportUrl;

    // Present once the vendor PDF exists — the detail page renders the card on
    // `{!!order.valuation && ...}`, so a BUILDING valuation shows the progress tracker
    // rather than a download card with nothing behind it.
    if (row.reportType === 'valuation' && row.reportUrl) {
        const spec = toJson(row.valuationSpec, {}) || {};
        detail.valuation = {
            modelName: spec.modelName || row.vehicleModel || '',
            year: spec.year || '',
            kilometres: spec.kilometres || '',
            city: spec.city || '',
            reportUrl: row.reportUrl,
        };
        // [] = vendor could not price the spec; the card then omits the chips.
        const bands = toJson(row.valuationBands, null);
        if (Array.isArray(bands) && bands.length) detail.valuation.bands = bands;
    }

    // Same presence-based contract as `valuation` above: absent until the RC lookup has
    // actually produced something, so a BUILDING history order renders the progress
    // tracker rather than a blank Vehicle History card.
    const history = toJson(row.historyResult, null);
    if (history && history.registrationNumber) detail.history = history;

    // Unlike the other two this is captured at purchase, so it is present from the moment
    // the order exists — the gate is only against a malformed row.
    const booking = toJson(row.inspectionBooking, null);
    if (booking && booking.slot1) detail.inspection = booking;

    return detail;
};

// POST /officeAndBusiness/garage/car-report/payment
// Peko collects (wallet/credit-line or PG) and records the report order. Vendor calls
// per product:
//   valuation — the PDF is ordered from Droom right after the order is recorded
//               (carReportPaas.js); it generates asynchronously and the webhook or the
//               read-time poll flips the order READY. A failed create does not fail this
//               response — the read path re-orders.
//   history   — the RC lookup IS the report, so running it pre-payment would give it away.
//               The order is recorded BUILDING and materialised on first read
//               (carReportHistory.js).
//   inspection — a technician must be dispatched whether or not the order is reopened, so
//               the Droom booking fires here, right after the order is recorded
//               (carReportInspection.js). A failed dispatch does not fail this response.
exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const { reportType, reportName, vehicle = {} } = req.body;
    // The shared payment screen sends `reg_num` from the selected fleet vehicle; a
    // manually entered history vehicle has none, and the plate arrives as the form's
    // `registrationNumber` instead.
    const regNum = req.body.reg_num || req.body.registrationNumber || null;
    const isValuation = reportType === 'valuation';
    const isInspection = reportType === 'inspection';

    if (!isPurchasable(reportType)) {
        return next(
            new ErrorResponse('This report type is not available for purchase yet', 400)
        );
    }
    if (!reportName) {
        return next(new ErrorResponse('reportName is required', 400));
    }
    const missing = missingRequiredFields(reportType, req.body);
    if (missing.length) {
        return next(new ErrorResponse(`Missing required field(s): ${missing.join(', ')}`, 400));
    }

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId,
        traceId: req?.LogTraceId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the car report service is currently unavailable.', 500));
    }

    // Pricing — BE is source of truth. Any amount in the request body is ignored.
    // Inspection prices from `packageId`, so an unknown or teaser package lands here as
    // null and must be refused before it becomes NaN in the total.
    const reportPrice = await resolvePlanPrice(reportType, req.body, credentialId, req?.LogTraceId);
    if (!reportPrice) {
        return next(new ErrorResponse('This package is not available for purchase', 400));
    }
    const convenienceFee = await resolveConvenienceFee(serviceDetails, reportPrice, credentialId);
    const sellingTotal = Number((reportPrice + convenienceFee).toFixed(2));

    const partnerData = req.user.registeredBy
        ? await fetchPartnerDetails(req.user.registeredBy)
        : await partnerLogos();
    const reportData = await computeJournalData({
        serviceDetails,
        amount: reportPrice,
        paymentMethod: 'WALLET',
        partnerDetails: partnerData,
        paymentGatewayName: 'WALLET',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });

    const corporateTxnId = new Date().valueOf();
    const publishJournal = (type) =>
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type,
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    const commonParams = {
        providerId: corporateTxnId.toString(),
        corporateTxnId,
        credentialId,
        serviceOperatorId: serviceDetails.id,
        corporateCashback: serviceDetails.cashback,
        accountNo: regNum || null,
        transactionCategory,
        orderAmount: sellingTotal,
        commissionType: serviceDetails.commissionType,
        cashbackType: serviceDetails.cashbackType,
        providerCommission: serviceDetails.providerCommission,
        payCashback: req.body.payCashback || false,
        surcharge: convenienceFee,
        reportData,
    };

    // 1) Collect payment (wallet/credit-line, or PG split) — the shared helpers also
    // write the `orders` row inside the same wallet-debit transaction.
    let transactionResponse;
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
        });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount: sellingTotal });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse.error, 500));
    }

    publishJournal('payment');

    // 2) Record the report order.
    const reportStatus = initialReportStatus(reportType);
    // A history payload carries no make/model — the real one is backfilled from the RC
    // response when the report is materialised, so the plate stands in until then.
    const vehicleModel = buildVehicleModel(vehicle, req.body) || regNum || '';
    let result;
    let createdOrder;
    try {
        createdOrder = await carReportOrder.create({
            corporateTxnId: String(corporateTxnId),
            credentialId,
            subCorporateUserId: req.user.subCorporateUserId || null,
            reportType,
            reportName,
            vehicleNumber: regNum || null,
            vehicleModel,
            // The inspection form collects its own body type at the top level; a manually
            // entered vehicle has none on the fleet record.
            bodyType: vehicle.bodyType || req.body.bodyType || null,
            isManualVehicle: !!vehicle.isManual,
            amount: sellingTotal,
            paymentMode: transactionResponse?.paymentMode || null,
            orderDate: new Date(),
            reportStatus,
            // Product-specific columns, each left null off its own product so the detail
            // page can never render an empty card belonging to another report type.
            valuationSpec: isValuation ? buildValuationSpec(req.body) : null,
            inspectionBooking: isInspection ? buildInspectionBooking(req.body) : null,
            formValues: req.body,
        });
        result = { status: true, data: {} };
    } catch (error) {
        result = { status: false, data: { message: 'Payment Failed! ' + error.message } };
        customLog(
            req?.LogTraceId,
            'error',
            { message: 'carReportOrder.create threw', error: error.message },
            'CAR_REPORT'
        );
    }

    // 3) Settle: success → confirm; failure → refund the collected amount.
    const account = regNum || vehicleModel || 'New vehicle';

    if (result.status) {
        await updateWalletTransaction({
            corporateTxnId,
            providerId: corporateTxnId,
            status: 'SUCCESS',
            message: 'Payment Successful',
            // orderId here is what the Car Reports success page reads back (via the
            // transaction-details lookup) to deep-link straight to this order.
            orderResponse: JSON.stringify({
                orderId: String(corporateTxnId),
                reportType,
                reportName,
                vehicleNumber: regNum || '',
                vehicleModel,
            }),
        });

        // Dispatch the technician now rather than on first read: an inspection is a
        // booking, and the customer may never reopen the order. dispatchInspection never
        // throws — a vendor outage leaves the order undispatched for the read path to
        // retry, and a vendor rejection refunds. Either way the payment response below is
        // unaffected, because the money is taken and the order exists.
        if (isInspection && createdOrder) {
            await dispatchInspection(
                {
                    id: createdOrder.id,
                    corporateTxnId: String(corporateTxnId),
                    vehicleNumber: regNum || null,
                    bodyType: vehicle.bodyType || req.body.bodyType || null,
                    formValues: req.body,
                },
                req
            );
        }

        // Order the vendor PDF now — same guarantees as the inspection dispatch:
        // never throws, a rejection refunds, a transient failure leaves the read
        // path to re-order.
        if (isValuation && createdOrder) {
            await dispatchPaasReport(
                {
                    id: createdOrder.id,
                    corporateTxnId: String(corporateTxnId),
                    formValues: req.body,
                },
                req
            );
        }

        // History is synchronous at the vendor, so build it right here — the customer
        // gets the report-ready email seconds after paying instead of on first open.
        // Same guarantees as the other two dispatches; the read path and the scheduler
        // sweep remain as safety nets (and cover the Cashfree leg).
        if (reportType === 'history' && createdOrder) {
            await materialiseHistoryReport(
                {
                    id: createdOrder.id,
                    corporateTxnId: String(corporateTxnId),
                    credentialId,
                    reportName,
                    reportStatus: 'BUILDING',
                    vehicleNumber: regNum || null,
                    vehicleModel,
                    bodyType: vehicle.bodyType || req.body.bodyType || null,
                    historyResult: null,
                },
                req
            );
        }

        const emailParams = [{ paramName: 'Vehicle', paramValue: account }];
        const body = generateCarReportPaymentSuccessEmail(corporateTxnId, sellingTotal.toFixed(2), account, req.user.name, partnerData, emailParams);
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: reportPrice,
            surcharge: convenienceFee,
            corporateTxnId,
            orderId: transactionResponse?.orderId ?? (await findOneOrder({ corporateTxnId }))?.id,
            paymentType: 'Car Report',
            credentialId,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(req.user.email, 'Payment Successful - Peko Car Reports', body, invoiceAttachments, () => {});
        createNotification({
            notificationTitle: 'Payment Successful',
            notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(sellingTotal)} for ${reportName} (${account}) with transaction ID ${corporateTxnId} was successful.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        // Spread transactionResponse first so corporateFinalBalance reaches the FE
        // (wallet refresh); orderId below deliberately overrides the orders-table PK it
        // carries, since the FE's ?orderId= is our corporateTxnId.
        return res.status(200).json({
            status: true,
            data: {
                ...transactionResponse,
                corporateTxnId,
                orderId: String(corporateTxnId),
                reportType,
                reportStatus: REPORT_STATUS_LABELS[reportStatus],
                serviceProvider: transactionCategory,
            },
            message: 'Payment Successful',
            responseCode: '000',
        });
    }

    const failureDetails = {
        corporateTxnId,
        status: 'FAILURE',
        providerId: corporateTxnId,
        message: 'Payment Failed!',
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify(result.data),
    };
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
        if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
            await refundWalletTransaction(failureDetails);
            publishJournal('refund');
        }
    } else {
        await refundWalletTransaction(failureDetails);
        publishJournal('refund');
    }

    const failBody = commonFailedTemplateforBillPayments(transactionCategory, account, 'Droom', req.user.name, partnerData);
    emailer.email(req.user.email, 'Transaction Failed', failBody, () => {});
    createNotification({
        notificationTitle: 'Payment Failed',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(sellingTotal)} for ${reportName} (${account}) with transaction ID ${corporateTxnId} was Failed.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });
    const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] });
    return res.status(500).json({
        status: false,
        data: { ...result.data, corporateFinalBalance: walletDetails && walletDetails.balance },
        message: 'Payment Failed',
        responseCode: '001',
    });
});

// GET /officeAndBusiness/garage/car-report/orders?searchText=&from=&to=&page=&itemsPerPage=
// Car report order history for THIS corporate, scoped by credentialId.
// GET /officeAndBusiness/garage/car-report/plans
// Live prices + availability for the FE cards. Vendor product codes stay internal —
// the FE only needs to know whether a package can actually be booked.
exports.fetchCarReportPlans = asyncHandler(async (req, res) => {
    const plans = ((await getActivePlans(req.user.id, req?.LogTraceId)) || []).filter((p) =>
        // The challan_* rows are Traffic Challan fee config, not sellable reports.
        ['valuation', 'history', 'inspection'].includes(p.reportType)
    );
    return res.status(200).json({
        status: true,
        data: {
            plans: plans.map((p) => ({
                reportType: p.reportType,
                packageId: p.packageId,
                displayName: p.displayName,
                price: Number(p.price) || 0,
                bookable: p.reportType !== 'inspection' || !!p.vendorProductCode,
            })),
        },
        message: 'Car report plans fetched successfully',
        responseCode: '000',
    });
});

exports.fetchCarReportOrders = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const itemsPerPage = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(req.query.itemsPerPage, 10) || DEFAULT_PAGE_SIZE)
    );
    const searchText = stripUnsearchable((req.query.searchText || '').toString()).trim();
    const from = (req.query.from || '').toString().trim();
    const to = (req.query.to || '').toString().trim();

    const where = { credentialId: req.user.id };

    // Sequelize runs with timezone '+05:30', so widening the bounds as local-day strings
    // keeps an IST evening order inside its own day — building Date objects here would
    // shift it out.
    if (from && to) {
        where.orderDate = { [Op.between]: [`${from} 00:00:00`, `${to} 23:59:59`] };
    } else if (from) {
        where.orderDate = { [Op.gte]: `${from} 00:00:00` };
    } else if (to) {
        where.orderDate = { [Op.lte]: `${to} 23:59:59` };
    }

    if (searchText) {
        const needle = `%${escapeLike(searchText)}%`;
        where[Op.or] = [
            { corporateTxnId: { [Op.like]: needle } },
            { reportName: { [Op.like]: needle } },
            { vehicleNumber: { [Op.like]: needle } },
            { vehicleModel: { [Op.like]: needle } },
        ];
    }

    const { rows, count } = await carReportOrder.findAndCountAll({
        where,
        order: [['orderDate', 'DESC']],
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        raw: true,
    });

    // Second pass for live payment status — `orders` associates on its own PK, not on
    // corporateTxnId, so this can't be an include.
    let paymentByTxn = new Map();
    if (rows.length) {
        const paymentRows = await order.findAll({
            where: { corporateTxnId: { [Op.in]: rows.map((r) => r.corporateTxnId) } },
            attributes: ['corporateTxnId', 'status', 'paymentMode'],
            raw: true,
        });
        paymentByTxn = new Map(paymentRows.map((r) => [String(r.corporateTxnId), r]));
    }

    const orders = rows.map((row) => {
        const payment = paymentByTxn.get(String(row.corporateTxnId)) || {};
        return toOrderDetail(row, payment.status, payment.paymentMode);
    });

    return res.status(200).json({
        status: true,
        data: { orders, count },
        message: 'Car report orders fetched successfully',
        responseCode: '000',
    });
});

// GET /officeAndBusiness/garage/car-report/orders/:orderId/detail
// Reads our own DB first; the vendor is only consulted for orders still in flight —
// each product's materialisation below is a no-op once the order has settled.
exports.fetchCarReportOrderDetail = asyncHandler(async (req, res, next) => {
    const orderId = (req.params.orderId || '').toString().trim();
    if (!orderId) return next(new ErrorResponse('orderId is required', 400));

    // credentialId is part of the lookup rather than a check afterwards, so one corporate
    // can never read another's order by guessing an epoch-ms id.
    let row = await carReportOrder.findOne({
        where: { corporateTxnId: orderId, credentialId: req.user.id },
        raw: true,
    });
    if (!row) return next(new ErrorResponse('Order not found', 404));

    // History reports are built on first open — this read calls the vendor and writes.
    // It never throws: a vendor failure leaves the order BUILDING and the page renders
    // the progress tracker as before.
    if (row.reportType === 'history' && row.reportStatus === 'BUILDING') {
        row = await materialiseHistoryReport(row, req);
    }

    // PDF fetch failed during materialisation (null = retryable; '' = vendor has none).
    if (row.reportType === 'history' && row.reportStatus === 'READY' && row.reportUrl == null) {
        row = await attachHistoryReportPdf(row, req);
    }

    // A BUILDING valuation is waiting on Droom's async PDF — re-orders if the payment
    // leg never managed to (e.g. the Cashfree leg has no Droom client), polls otherwise.
    if (row.reportType === 'valuation' && row.reportStatus === 'BUILDING') {
        row = await materialisePaasReport(row, req);
    }

    // Band chips are fetched once on first open of a READY order; only a genuine
    // outage (null column) retries.
    if (
        row.reportType === 'valuation' &&
        row.reportStatus === 'READY' &&
        row.valuationBands == null
    ) {
        row = await fetchValuationBands(row, req);
    }

    // Safety net for inspections the payment leg could not dispatch — either the vendor
    // was down, or the order came from the Cashfree leg in paymentGateway, which has no
    // Droom client. A null vendorReference is exactly "paid for but not yet booked".
    if (row.reportType === 'inspection' && row.reportStatus === 'BOOKED' && !row.vendorReference) {
        row = await dispatchInspection(row, req);
    }

    const payment = await order.findOne({
        where: { corporateTxnId: orderId },
        attributes: ['status', 'paymentMode'],
        raw: true,
    });

    return res.status(200).json({
        status: true,
        data: toOrderDetail(row, payment?.status, payment?.paymentMode),
        message: 'Car report order detail fetched successfully',
        responseCode: '000',
    });
});
