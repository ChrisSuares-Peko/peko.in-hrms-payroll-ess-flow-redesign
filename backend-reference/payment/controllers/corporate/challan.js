const { Op } = require('sequelize');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/pamentGatewayTransaction');
const { refundGatewayTransaction } = require('./pluralGateway');
const { getDroomToken, fetchChallans, pushOrder, getOrderDetail } = require('../../utils/droomClient');
const { customLog } = require('../../utils/loggerHelper');
const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middlewares/async');
const garageFleet = require('../../models/entities/garage_fleet');
const operatorsData = require('../../utils/operatorsData.json');
const emailer = require('../../utils/emailer');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateMobilePaymentSuccessEmailBill, commonFailedTemplateforBillPayments } = require('../../utils/emailTemplate/billpayments');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { createNotification } = require('../../models/use-cases/notification');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const wallet = require('../../models/entities/wallet');
const order = require('../../models/entities/order');
const serviceOperator = require('../../models/entities/serviceOperator');
const fleetChallanCache = require('../../models/entities/fleetChallanCache');

const frontendBaseUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

// Fleet cache is considered stale after this; a refresh re-fetches only stale/missing vehicles.
const FLEET_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REFRESH_BATCH = 8; // max concurrent Droom get-challan calls per refresh batch

// A JSON column read with raw:true may come back as an array or a JSON string; normalise to array.
const toChallanArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return [];
};

// Run an async mapper over items in fixed-size concurrent batches (avoids hammering Droom).
const inBatches = async (items, size, fn) => {
    for (let i = 0; i < items.length; i += size) {
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(items.slice(i, i + size).map(fn));
    }
};

const accessKey = operatorsData.challan.accessKey;
const transactionCategory = operatorsData.challan.type;

// Map our internal order status to the labels shown on the Order History screen.
// The richer "resolved" states are written later by the Droom status callback.
const ORDER_STATUS_LABELS = {
    SUCCESS: 'Assigned',
    PENDING: 'Processing',
    INITIATED: 'Processing',
    FAILURE: 'Failed',
    FAILED: 'Failed',
    REFUND: 'Completely Refunded',
    REFUNDED: 'Completely Refunded',
    PARTIAL_REFUND: 'Partially Refunded',
    CHALLAN_PARTIALLY_RESOLVED: 'Challan Partially Resolved',
    CHALLAN_COMPLETELY_RESOLVED: 'Challan Completely Resolved',
};

// A PENDING challan order can't complete after the request that created it — settlement is
// synchronous and the Droom webhook only advances orders already at SUCCESS. Older = dead.
const STALE_PENDING_MS = 30 * 60 * 1000;
const OPEN_STATUSES = new Set(['PENDING', 'INITIATED']);

const resolveOrderLabel = (status, transactionDate) => {
    const key = (status || '').toUpperCase();
    if (ORDER_STATUS_LABELS[key] && !OPEN_STATUSES.has(key)) return ORDER_STATUS_LABELS[key];
    if (!transactionDate) return 'Processing';
    return Date.now() - new Date(transactionDate).getTime() > STALE_PENDING_MS ? 'Failed' : 'Processing';
};

// Reject malformed payloads before any wallet debit — a challan without a price or vehicle would
// otherwise be recorded as a ₹0 order with no vehicle that never settles (ticket 30967).
const validateChallanPayload = (challans, regNum) => {
    if (!Array.isArray(challans) || challans.length === 0) return 'No challans selected for payment';
    const invalid = challans.some(
        c =>
            !c ||
            !String(c.challan_number || '').trim() ||
            !(Number(c.challan_price) > 0) ||
            !String(c.registration_number || regNum || '').trim()
    );
    return invalid ? 'Invalid challan details: challan number, amount and vehicle number are required' : null;
};

// Resolve Droom vendor config + a Bearer token for the given corporate.
const resolveVendorAndToken = async (req) => {
    const serviceDetails = await fetchServiceDetails({
        credentialId: req.user.id,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId: req.user.corporateId,
        traceId: req?.LogTraceId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return { error: serviceDetails.error };
    }
    const token = await getDroomToken(serviceDetails.vendor, req?.LogTraceId);
    if (!token) return { error: 'Unable to authenticate with the challan provider' };
    return { serviceDetails, token };
};

// GET /payment/challan/fetch?vehicle_number=<VRN> — challans for a single vehicle (Bill Payments).
exports.fetchVehicleChallans = asyncHandler(async (req, res, next) => {
    const vehicleNumber = (req.query.vehicle_number || '').toString().trim();
    if (!vehicleNumber) {
        return next(new ErrorResponse('vehicle_number is required', 400));
    }
    const resolved = await resolveVendorAndToken(req);
    if (resolved.error) return next(new ErrorResponse(resolved.error, 500));

    const result = await fetchChallans(resolved.serviceDetails.vendor, vehicleNumber, resolved.token, req?.LogTraceId);
    if (!result.status) {
        return next(new ErrorResponse('Unable to fetch challans. Please try again later.', 502));
    }
    return res.status(200).json({
        status: true,
        data: result.data,
        message: 'Challans fetched successfully',
        responseCode: '000',
    });
});

// The corporate's Turbo fleet lives in the shared `garage_fleets` table (owned by the
// officeAndBusiness service). Same DB, so we read it directly via the garage_fleet model.
const getFleetVehicleNumbers = async (req) => {
    const rows = await garageFleet.findAll({
        where: { credentialId: req.user.id, isDeleted: false },
        attributes: ['vehicleNumber'],
        raw: true,
    });
    return [...new Set(rows.map(r => (r.vehicleNumber || '').trim()).filter(Boolean))];
};

// Court matter unless the flag reads 'NA'/'No'/'' — Droom sends "Yes"/"No", not a reference.
const NON_COURT_VALUES = new Set(['', 'na', 'no', 'n/a', '-']);
const isCourtMatter = (c) =>
    !!c.court_challan && !NON_COURT_VALUES.has(String(c.court_challan).trim().toLowerCase());

const buildFleetSummary = (challans) => {
    let totalOutstanding = 0;
    let pending = 0;
    let paid = 0;
    let courtMatters = 0;
    challans.forEach(c => {
        if (isCourtMatter(c)) courtMatters += 1;
        else if (c.challan_status === 'Paid') paid += 1;
        else if (c.challan_status === 'Pending') {
            pending += 1;
            totalOutstanding += Number(c.amount) || 0;
        }
    });
    return { totalOutstanding, pending, paid, courtMatters };
};

// GET /payment/challan/fleet[?refresh=true] — fleet challans served from our per-vehicle cache.
// Default: instant read from the cache table (one query), no live Droom calls.
// ?refresh=true: re-fetch only stale/missing vehicles from Droom in small concurrent batches,
// upsert the cache, then return the fresh aggregate. Keeps the page fast for large fleets.
exports.fetchFleetChallans = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const wantRefresh = String(req.query.refresh || '') === 'true';

    let vehicleNumbers = [];
    try {
        vehicleNumbers = await getFleetVehicleNumbers(req);
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: 'Fleet lookup failed', error: error.message }, 'CHALLAN');
        return next(new ErrorResponse('Unable to load your fleet. Please try again later.', 502));
    }

    if (vehicleNumbers.length === 0) {
        return res.status(200).json({
            status: true,
            data: { challans: [], summary: buildFleetSummary([]), stale: false, lastUpdated: null },
            message: 'Fleet challans fetched successfully',
            responseCode: '000',
        });
    }

    const cacheRows = await fleetChallanCache.findAll({
        where: { credentialId, vehicleNumber: { [Op.in]: vehicleNumbers } },
        raw: true,
    });
    const cacheByVehicle = new Map(cacheRows.map(r => [r.vehicleNumber, r]));
    const now = Date.now();
    const isStale = row =>
        !row || !row.lastFetchedAt || now - new Date(row.lastFetchedAt).getTime() > FLEET_CACHE_TTL_MS;

    if (wantRefresh) {
        const staleVehicles = vehicleNumbers.filter(v => isStale(cacheByVehicle.get(v)));
        if (staleVehicles.length > 0) {
            const resolved = await resolveVendorAndToken(req);
            if (resolved.error) return next(new ErrorResponse(resolved.error, 500));
            const fetchedAt = new Date();
            await inBatches(staleVehicles, REFRESH_BATCH, async vrn => {
                const result = await fetchChallans(
                    resolved.serviceDetails.vendor,
                    vrn,
                    resolved.token,
                    req?.LogTraceId
                );
                if (!result.status) return; // keep existing cache for this vehicle on failure
                const challans = result.data || [];
                await fleetChallanCache.upsert({ credentialId, vehicleNumber: vrn, challans, lastFetchedAt: fetchedAt });
                cacheByVehicle.set(vrn, { vehicleNumber: vrn, challans, lastFetchedAt: fetchedAt });
            });
        }
    }

    const challans = vehicleNumbers.flatMap(v => toChallanArray(cacheByVehicle.get(v)?.challans));
    const timestamps = vehicleNumbers
        .map(v => cacheByVehicle.get(v)?.lastFetchedAt)
        .filter(Boolean)
        .map(d => new Date(d).getTime());
    const lastUpdated = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null;
    const stale = vehicleNumbers.some(v => isStale(cacheByVehicle.get(v)));

    return res.status(200).json({
        status: true,
        data: { challans, summary: buildFleetSummary(challans), stale, lastUpdated },
        message: 'Fleet challans fetched successfully',
        responseCode: '000',
    });
});

// GET /payment/challan/orders — past challan payment orders for THIS corporate.
// Built from our own `orders` table (scoped by credentialId), NOT Droom's order-list —
// so each corporate only ever sees its own orders, and we don't depend on the vendor.
exports.fetchChallanOrders = asyncHandler(async (req, res) => {
    const rows = await order.findAll({
        where: { credentialId: req.user.id },
        include: [{ model: serviceOperator, attributes: [], where: { accessKey } }],
        attributes: ['corporateTxnId', 'transactionDate', 'amountInINR', 'status', 'accountNo'],
        order: [['transactionDate', 'DESC']],
        raw: true,
    });

    const orders = rows
        // ₹0 with no vehicle only comes from a malformed payload and never held money — hide it.
        .filter(r => (Number(r.amountInINR) || 0) > 0 || String(r.accountNo || '').trim())
        .map(r => ({
            orderId: r.corporateTxnId,
            orderDate: r.transactionDate ? new Date(r.transactionDate).toISOString().split('T')[0] : '',
            amount: Number(r.amountInINR) || 0,
            vehicleNumber: r.accountNo || '',
            status: resolveOrderLabel(r.status, r.transactionDate),
        }));

    return res.status(200).json({
        status: true,
        data: orders,
        message: 'Challan orders fetched successfully',
        responseCode: '000',
    });
});

// GET /payment/challan/orders/:orderId/detail — live status from Droom (View drawer).
// orderId is our corporateTxnId, i.e. the reference_id sent on Push Order.
exports.fetchChallanOrderDetail = asyncHandler(async (req, res, next) => {
    const orderId = (req.params.orderId || '').toString().trim();
    if (!orderId) return next(new ErrorResponse('orderId is required', 400));

    const resolved = await resolveVendorAndToken(req);
    if (resolved.error) return next(new ErrorResponse(resolved.error, 500));

    const result = await getOrderDetail(resolved.serviceDetails.vendor, orderId, resolved.token, req?.LogTraceId);
    if (!result.status) {
        return next(new ErrorResponse('Unable to fetch order details. Please try again later.', 502));
    }

    // Real shape: data = { challans:[{ challan_id, challan_status, amount, ... }], order_summary }.
    // (Tolerate the doc's array/`data[]` shape too.) order-detail uses `challan_id`.
    const root = Array.isArray(result.data) ? result.data[0] : result.data || {};
    const rawChallans = Array.isArray(root.challans)
        ? root.challans
        : Array.isArray(root.data)
        ? root.data
        : [];
    const summary = root.order_summary || {};
    const challans = rawChallans.map(c => ({
        challan_number: c.challan_id || c.challan_number,
        registration_number: c.registration_number || summary.registration_no,
        amount: Number(c.amount) || 0,
        challan_price: Number(c.challan_price ?? c.amount) || 0,
        challan_status: c.challan_status || c.status,
        offense_details: c.offense_details,
    }));

    // order-detail carries no order-level status; omit it so the FE keeps the list's
    // (callback-synced) status instead of overwriting it.
    const data = {
        orderId: (rawChallans[0] && rawChallans[0].order_id) || orderId,
        amount: Number(summary.total_amount_paid ?? root.amount) || 0,
        challans,
    };
    if (root.status) data.status = root.status;

    return res.status(200).json({
        status: true,
        data,
        message: 'Order detail fetched successfully',
        responseCode: '000',
    });
});

// The convenience fee is per challan — split the total equally, in paise so the items
// sum exactly to what was charged; any remainder lands on the first item.
const allocateConvenienceFee = (challans, totalFee) => {
    if (!challans.length) return [];
    const totalPaise = Math.round(Number(totalFee) * 100);
    const share = Math.floor(totalPaise / challans.length);
    const fees = challans.map(() => share);
    fees[0] += totalPaise - share * challans.length;
    return fees.map(p => p / 100);
};

// POST /payment/challan/payment — Peko collects (wallet/credit-line or PG) then Push Order to Droom.
exports.payment = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const corporateUserId = req.user.corporateId;
    const { challans = [], reg_num: regNum } = req.body;

    const invalidReason = validateChallanPayload(challans, regNum);
    if (invalidReason) {
        return next(new ErrorResponse(invalidReason, 400));
    }

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId,
        traceId: req?.LogTraceId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the challan service is currently unavailable.', 500));
    }

    // The list the user selected from can be hours old (fleet cache TTL), so re-check the
    // selected challans against Droom before any debit — otherwise a challan settled elsewhere
    // in the meantime gets paid twice. Vendor trouble here is NOT a reason to block a payment:
    // we only stop on a definite "this challan is no longer pending".
    const verifyVehicle = regNum || challans[0].registration_number;
    const verifyToken = await getDroomToken(serviceDetails.vendor, req?.LogTraceId);
    const liveChallans = verifyToken
        ? await fetchChallans(serviceDetails.vendor, verifyVehicle, verifyToken, req?.LogTraceId)
        : { status: false };
    if (liveChallans.status) {
        const liveByNumber = new Map(
            (liveChallans.data || []).map(c => [String(c.challan_number).trim(), c])
        );
        const notPayable = challans.filter(c => {
            const live = liveByNumber.get(String(c.challan_number).trim());
            return !live || live.challan_status !== 'Pending';
        });
        if (notPayable.length > 0) {
            customLog(req?.LogTraceId, 'info', { message: 'Challan payment blocked — selection no longer pending', vehicleNumber: verifyVehicle, challanNumbers: notPayable.map(c => c.challan_number) }, 'CHALLAN');
            return next(new ErrorResponse('One or more selected challans are no longer pending. Please refresh and try again.', 400));
        }
    } else {
        customLog(req?.LogTraceId, 'info', { message: 'Challan pre-payment verification skipped — vendor lookup unavailable', vehicleNumber: verifyVehicle }, 'CHALLAN');
    }

    // Pricing — BE is source of truth. challan_price = fine; convenience_fee = Peko
    // surcharge, a FLAT one charged per challan; discount = 0.
    const challanTotal = challans.reduce((sum, c) => sum + Number(c.challan_price), 0);
    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        challanTotal,
        credentialId,
        challans.length
    );
    const convenienceFeeTotal = Number(surchargeDetails.surcharge) || 0;
    const sellingTotal = Number((challanTotal + convenienceFeeTotal).toFixed(2));
    const perChallanFees = allocateConvenienceFee(challans, convenienceFeeTotal);

    const partnerData = await fetchPartnerDetails(req.user.registeredBy);
    const reportData = await computeJournalData({
        serviceDetails,
        amount: challanTotal,
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
        accountNo: regNum || challans[0].registration_number,
        transactionCategory,
        // Base only — the transaction helpers add `surcharge` on top themselves.
        orderAmount: challanTotal,
        commissionType: serviceDetails.commissionType,
        cashbackType: serviceDetails.cashbackType,
        providerCommission: serviceDetails.providerCommission,
        payCashback: req.body.payCashback || false,
        surcharge: convenienceFeeTotal,
        reportData
    };

    // 1) Collect payment (wallet/credit-line, or PG split) — reuses the shared utilities.
    let transactionResponse;
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
        });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount: challanTotal });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        return next(new ErrorResponse(transactionResponse.error, 500));
    }

    publishJournal('payment');

    // 2) Push Order(s). Droom processes one reg_num per order, so group by registration number.
    const groups = {};
    challans.forEach((c, i) => {
        const fee = perChallanFees[i] || 0;
        const rn = c.registration_number || regNum;
        if (!groups[rn]) groups[rn] = { items: {}, total: 0 };
        const sellingPrice = Number((Number(c.challan_price) + fee).toFixed(2));
        groups[rn].items[c.challan_number] = {
            selling_price: sellingPrice,
            discount: 0,
            challan_price: Number(c.challan_price),
            convenience_fee: fee,
        };
        groups[rn].total += sellingPrice;
    });
    const regNums = Object.keys(groups);
    const customerName = req.user.name || req.user.contactPersonName || 'Peko Platforms';
    const phoneNumber = (req.user.mobileNo || req.user.mobile || '').toString();

    let result;
    try {
        const token = await getDroomToken(serviceDetails.vendor, req?.LogTraceId);
        if (!token) {
            result = { status: false, data: { message: 'Provider authentication failed' } };
        } else {
            const orderResults = [];
            for (let i = 0; i < regNums.length; i += 1) {
                const rn = regNums[i];
                const pushBody = {
                    // Unique reference per order; suffix when more than one.
                    reference_id: regNums.length > 1 ? `${corporateTxnId}-${i}` : corporateTxnId.toString(),
                    total_amount: String(Number(groups[rn].total.toFixed(2))),
                    customer_name: customerName,
                    phone_number: phoneNumber,
                    reg_num: rn,
                    email: req.user.email,
                    user_id: String(corporateUserId),
                    items: groups[rn].items,
                };
                // eslint-disable-next-line no-await-in-loop
                orderResults.push(await pushOrder(serviceDetails.vendor, pushBody, token, req?.LogTraceId));
            }
            // All-or-nothing: the collected payment is a single Peko transaction.
            result = {
                status: orderResults.length > 0 && orderResults.every(r => r.status),
                data: orderResults.length === 1 ? orderResults[0].data : { orders: orderResults.map(r => r.data) },
            };
        }
    } catch (error) {
        result = { status: false, data: { message: 'Payment Failed! ' + error.message } };
        customLog(req?.LogTraceId, 'error', { message: 'Droom pushOrder threw', error: error.message }, 'VENDOR');
    }

    // 3) Settle: success → confirm; failure → refund the collected amount.
    // Email + notification mirror the shared bill-payment success/failure side-effects.
    const account = regNums.join(', ') || regNum || challans[0].registration_number;

    if (result.status) {
        // Persist challan numbers (seeded 'Assigned') so the callback can match by Challan_number
        // (it sends no reference_id).
        const challanStatuses = {};
        challans.forEach(c => {
            challanStatuses[c.challan_number] = 'Assigned';
        });
        await updateWalletTransaction({
            corporateTxnId,
            providerId: result?.data?.data?.reference_id ?? corporateTxnId,
            status: 'SUCCESS',
            message: 'Payment Successful',
            orderResponse: JSON.stringify({ response: result.data, challanStatuses }),
        });

        // Invalidate the paid vehicles' fleet cache so the Turbo view re-fetches (paid → not outstanding).
        // No-op if the vehicle isn't a cached fleet vehicle (e.g. a Bill-flow vehicle).
        fleetChallanCache
            .update({ lastFetchedAt: new Date(0) }, { where: { credentialId, vehicleNumber: { [Op.in]: regNums } } })
            .catch(err =>
                customLog(req?.LogTraceId, 'error', { message: 'Fleet cache invalidation failed', error: err.message }, 'CHALLAN')
            );

        const challanSubject = `${transactionCategory} Successful`;
        const loginUrl = `${frontendBaseUrl}/auth/login`;
        const resolvedChallanSuccess = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
            service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
            variables: {
                serviceType: transactionCategory,
                name: req.user.name,
                branding: partnerData?.branding || 'Peko',
                website: partnerData?.website || 'https://www.peko.one',
                loginUrl,
                ...v2LayoutVariables(partnerData),
            },
            fallback: () => generateMobilePaymentSuccessEmailBill(transactionCategory, req.user.name, partnerData, loginUrl),
            fallbackSubject: challanSubject,
            partnerId: req.user.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });
        const planDetails = challans.map((c) => ({
            name: c.challan_number ? `Traffic Challan ${c.challan_number}` : 'Traffic Challan',
            amount: Number(c.challan_price),
            quantity: 1,
        }));
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: sellingTotal,
            couponDiscount: transactionResponse?.couponDiscount || 0,
            corporateTxnId,
            orderId: transactionResponse?.orderId,
            paymentType: transactionCategory || 'Traffic Challan',
            credentialId: req.user.id,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(req.user.email, resolvedChallanSuccess.subject, resolvedChallanSuccess.html, invoiceAttachments, undefined, () => {});
        createNotification({
            notificationTitle: 'Payment Successful',
            notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(sellingTotal)} for vehicle ${account} with transaction ID ${corporateTxnId} (${transactionCategory}) was successful.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        // Spread transactionResponse so corporateFinalBalance reaches the FE (wallet refresh).
        return res.status(200).json({
            status: true,
            data: { ...transactionResponse, corporateTxnId, serviceProvider: transactionCategory },
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

    const resolvedChallanFailed = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
            serviceType: transactionCategory,
            account,
            serviceProvider: 'Droom',
            name: req.user.name,
            branding: partnerData?.branding || 'Peko',
            website: partnerData?.website || 'https://www.peko.one',
            logo: partnerData?.logo,
            ...v2LayoutVariables(partnerData),
        },
        fallback: () => commonFailedTemplateforBillPayments(transactionCategory, account, 'Droom', req.user.name, partnerData),
        fallbackSubject: 'Transaction Failed',
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
    });
    emailer.email(req.user.email, resolvedChallanFailed.subject, resolvedChallanFailed.html, () => {});
    createNotification({
        notificationTitle: 'Payment Failed',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(sellingTotal)} for vehicle ${account} with transaction ID ${corporateTxnId} (${transactionCategory}) was Failed.`,
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
