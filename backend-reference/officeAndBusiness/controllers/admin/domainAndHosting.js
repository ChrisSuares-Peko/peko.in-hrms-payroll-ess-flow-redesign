const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { Op } = require('sequelize');
const axios = require('axios');
const sequelizeConfig = require('../../configs/database/index');
const orders = require('../../models/entities/order');
const serviceOperators = require('../../models/entities/serviceOperator');
const vendors = require('../../models/entities/vendor');
const transaction = require('../../models/entities/transaction');
const wallet = require('../../models/entities/wallet');
const credential = require('../../models/entities/credential');
const { createNotification } = require('../../models/use-cases/notification');
const { refundWalletTransaction } = require('../../utils/walletTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const operatorsData = require('../../utils/operatorsData.json');
const { ORDER_DETAIL_RESOLVERS } = require('../../utils/domainHostingResolvers');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const emailer = require('../../utils/emailer');
const { resolveDomainHostingRefundInitiatedEmail } = require('../../utils/emailTemplates/domainAndHosting');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');

const DOMAIN_HOSTING_ACCESS_KEY = operatorsData['domainAndHosting']['accessKey'];

// ─── Get Single Order Details (DB + live vendor fetch) ───────────────────────

exports.getOrderDetails = asyncHandler(async (req, res, next) => {
    const { corporateTxnId } = req.params;

    // ── 1. Fetch order from DB ────────────────────────────────────────────────
    const orderRecord = await orders.findOne({
        where: { corporateTxnId },
        include: [
            {
                model: serviceOperators,
                where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY },
                attributes: ['id', 'serviceProvider'],
            },
            {
                model: credential,
                attributes: ['id', 'username', 'name'],
            },
        ],
        attributes: [
            'id', 'corporateTxnId', 'transactionDate', 'amountInINR',
            'surcharge', 'status', 'paymentMode', 'orderResponse', 'message',
            'providerId', 'credentialId',
        ],
        raw: true,
        nest: true,
    });

    if (!orderRecord) {
        return next(new ErrorResponse('Order not found', 404));
    }

    const parsedOrderResponse = orderRecord.orderResponse
        ? (typeof orderRecord.orderResponse === 'string'
            ? JSON.parse(orderRecord.orderResponse)
            : orderRecord.orderResponse)
        : {};

    // ── 2. Fetch vendor credentials separately ────────────────────────────────
    let liveVendorDetails = null;

    const itemType = parsedOrderResponse.cancelledItemType
        || parsedOrderResponse.items?.[0]?.itemType;
    const productId = parsedOrderResponse.items?.[0]?.productId;
    const vendorOrderId = orderRecord.providerId;

    const serviceOperator = await serviceOperators.findOne({
        where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY },
        include: [{ model: vendors, attributes: ['apiUrl', 'optional1', 'optional2'] }],
        raw: true,
        nest: true,
    });

    const baseUrl = serviceOperator?.vendor?.apiUrl;
    const authParams = {
        'auth-userid': serviceOperator?.vendor?.optional1,
        'api-key': serviceOperator?.vendor?.optional2,
    };

    // ── 3. Call live vendor API ───────────────────────────────────────────────
    if (itemType && vendorOrderId && baseUrl && authParams['api-key']) {
        const detailResolver = ORDER_DETAIL_RESOLVERS[itemType];
        if (detailResolver) {
            try {
                const { url, query, method = 'GET' } = detailResolver(baseUrl, authParams, vendorOrderId, productId);
                const response = method === 'GET'
                    ? await axios.get(`${url}?${query}`)
                    : await axios.post(`${url}?${query}`);
                liveVendorDetails = response.data;
                customLog(req?.LogTraceId, 'info', { action: 'getOrderDetails:liveVendor', itemType, vendorOrderId }, 'VENDOR');
            } catch (err) {
                customLog(req?.LogTraceId, 'error', { action: 'getOrderDetails:liveVendor:error', error: err?.response?.data || err.message, itemType, vendorOrderId }, 'VENDOR');
            }
        }
    }

    return res.status(200).json({
        status: true,
        message: 'Order details fetched successfully',
        responseCode: '000',
        data: {
            ...orderRecord,
            orderResponse: parsedOrderResponse,
            liveVendorDetails,
        },
    });
});

// ─── List Cancellation Requests ───────────────────────────────────────────────

exports.listCancellationRequests = asyncHandler(async (req, res, next) => {
    try {
        const {
            limit = 10,
            page = 1,
            from,
            to,
            searchText = '',
            sort = 'DESC',
        } = req.query;

        const itemsPerPage = parseInt(limit, 10);
        const offset = (parseInt(page, 10) - 1) * itemsPerPage;

        const where = { status: 'CANCELLATION_REQUESTED' };

        if (from && to) {
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1);
            toDate.setHours(0, 0, 0, 0);
            where.transactionDate = { [Op.between]: [from, toDate] };
        }

        if (searchText) {
            where[Op.or] = [
                { corporateTxnId: { [Op.like]: `%${searchText}%` } },
                { paymentMode: { [Op.like]: `%${searchText}%` } },
            ];
        }

        const result = await orders.findAndCountAll({
            where,
            include: [
                {
                    model: serviceOperators,
                    where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY },
                    attributes: ['id', 'serviceProvider'],
                },
                {
                    model: credential,
                    attributes: ['id', 'username', 'name'],
                },
            ],
            attributes: [
                'id', 'corporateTxnId', 'transactionDate', 'amountInINR',
                'status', 'paymentMode', 'orderResponse', 'message', 'credentialId',
            ],
            order: [['transactionDate', sort === 'ASC' ? 'ASC' : 'DESC']],
            limit: itemsPerPage,
            offset,
            raw: true,
            nest: true,
        });

        return res.status(200).json({
            status: true,
            message: 'Cancellation requests retrieved successfully',
            responseCode: '000',
            data: {
                data: result.rows,
                count: result.count,
                totalPages: Math.ceil(result.count / itemsPerPage),
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { action: 'listCancellationRequests', error: error.message });
        return next(new ErrorResponse('Failed to retrieve cancellation requests', 500));
    }
});

// ─── Process Refund ───────────────────────────────────────────────────────────

exports.processRefund = asyncHandler(async (req, res, next) => {
    const { corporateTxnId, refundAmount, remarks } = req.body;
    const adminId = req.user.id;

    if (!corporateTxnId || refundAmount == null || !remarks || !String(remarks).trim()) {
        return next(new ErrorResponse('corporateTxnId, refundAmount and remarks are required', 400));
    }

    const parsedRefundAmount = parseFloat(refundAmount);
    if (isNaN(parsedRefundAmount) || parsedRefundAmount < 0) {
        return next(new ErrorResponse('Refund amount must be 0 or a positive number', 400));
    }

    const orderRecord = await orders.findOne({
        where: { corporateTxnId },
        include: [
            {
                model: serviceOperators,
                where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY },
                attributes: [],
            },
            {
                model: credential,
                attributes: ['id', 'username', 'name', 'email', 'registeredBy'],
            },
        ],
        attributes: [
            'id', 'corporateTxnId', 'transactionDate', 'amountInINR',
            'status', 'paymentMode', 'orderResponse', 'paymentModeResponse', 'credentialId',
        ],
        raw: true,
        nest: true,
    });

    if (!orderRecord) {
        return next(new ErrorResponse('Order not found', 404));
    }

    if (['REFUNDED', 'CANCELLED'].includes(orderRecord.status)) {
        return next(new ErrorResponse('This order has already been processed', 400));
    }

    if (orderRecord.status !== 'CANCELLATION_REQUESTED') {
        return next(new ErrorResponse('Order is not in cancellation requested state', 400));
    }

    const originalAmount = parseFloat(orderRecord.amountInINR);

    if (parsedRefundAmount > originalAmount) {
        return next(new ErrorResponse(`Refund amount cannot exceed the original amount of ₹${originalAmount}`, 400));
    }

    const existingResponse = orderRecord.orderResponse
        ? (typeof orderRecord.orderResponse === 'string'
            ? JSON.parse(orderRecord.orderResponse)
            : orderRecord.orderResponse)
        : {};

    const customerUsername = orderRecord['credential.username'] || orderRecord.credential?.username;
    const customerName = orderRecord['credential.name'] || orderRecord.credential?.name;
    const customerEmail = orderRecord['credential.email'] || orderRecord.credential?.email;
    const customerRegisteredBy = orderRecord['credential.registeredBy'] || orderRecord.credential?.registeredBy;

    try {
        // No refund — just mark as cancelled with admin remarks
        if (parsedRefundAmount === 0) {
            await orders.update(
                {
                    status: 'CANCELLED',
                    message: remarks,
                    orderResponse: JSON.stringify({
                        ...existingResponse,
                        refundAmount: 0,
                        adminRemarks: remarks,
                        cancelledByAdminAt: new Date(),
                    }),
                },
                { where: { corporateTxnId } }
            );

            if (customerUsername) {
                try {
                    await createNotification({
                        notificationTitle: 'Domain & Hosting Cancellation Approved',
                        notificationBrief: `Your cancellation request for order ${corporateTxnId} has been approved. No refund was issued. Remarks: ${remarks}`,
                        notificationTo: customerUsername,
                        notificationCategory: 'CORPORATE',
                        notificationBy: 'ADMIN',
                    });
                } catch (notifErr) {
                    customLog(req?.LogTraceId, 'info', { action: 'processRefund:notification', error: notifErr.message });
                }
            }

            customLog(req?.LogTraceId, 'info', { action: 'processRefund:noRefund', corporateTxnId, adminId });

            return res.status(200).json({
                status: true,
                message: 'Cancellation approved without refund',
                responseCode: '000',
                data: {},
            });
        }

        // Full or partial refund
        const isPGPayment = ['PG', 'PG + WALLET', 'PAYMENT GATEWAY', 'PAYMENT GATEWAY + WALLET'].includes(orderRecord.paymentMode);
        const isHybridPayment = ['PG + WALLET', 'PAYMENT GATEWAY + WALLET'].includes(orderRecord.paymentMode);

        if (isPGPayment) {
            // For hybrid (PG + WALLET) orders, Cashfree can only refund up to pgAmount.
            // The wallet portion must be credited back separately.
            let pgRefundAmount = parsedRefundAmount;
            let walletRefundAmount = 0;

            if (isHybridPayment) {
                let paymentModeData = {};
                try {
                    paymentModeData = orderRecord.paymentModeResponse
                        ? JSON.parse(orderRecord.paymentModeResponse)
                        : {};
                } catch { /**/ }
                const pgAmount = Number(paymentModeData?.pgAmount || 0);
                if (pgAmount > 0) {
                    pgRefundAmount = Math.min(parsedRefundAmount, pgAmount);
                    walletRefundAmount = parsedRefundAmount - pgRefundAmount;
                }
            }

            const pgRefundResult = await cancelPGTransaction(corporateTxnId, pgRefundAmount);
            customLog(req?.LogTraceId, 'info', { action: 'processRefund:pgRefund', pgRefundResult, pgRefundAmount, corporateTxnId }, 'VENDOR');
            if (!pgRefundResult.status) {
                return next(new ErrorResponse(pgRefundResult.message || 'Cashfree refund failed. Please try again.', 500));
            }

            if (walletRefundAmount > 0) {
                await partialWalletCredit({ corporateTxnId, refundAmount: walletRefundAmount, remarks });
            }
        } else {
            const isFullRefund = parsedRefundAmount === originalAmount;
            if (isFullRefund) {
                const refundResult = await refundWalletTransaction({
                    corporateTxnId,
                    registeredById: adminId,
                    status: 'REFUNDED',
                    message: remarks,
                });
                if (refundResult === 'ALREADY REFUNDED') {
                    return next(new ErrorResponse('This order has already been refunded', 400));
                }
                if (refundResult === 'NO TRANSACTIONS FOUND') {
                    return next(new ErrorResponse('No wallet transaction found for this order', 404));
                }
            } else {
                await partialWalletCredit({ corporateTxnId, refundAmount: parsedRefundAmount, remarks });
            }
        }

        await orders.update(
            {
                status: 'REFUNDED',
                message: remarks,
                orderResponse: JSON.stringify({
                    ...existingResponse,
                    refundAmount: parsedRefundAmount,
                    adminRemarks: remarks,
                    refundedAt: new Date(),
                }),
            },
            { where: { corporateTxnId } }
        );

        let refundBrief;
        if (isHybridPayment) {
            refundBrief = `A refund of ₹${formatNumberWithLocalString(parsedRefundAmount)} has been processed: the payment gateway portion has been initiated to your original payment method and any wallet portion has been credited to your wallet. Transaction ID: ${corporateTxnId}. Remarks: ${remarks}`;
        } else if (isPGPayment) {
            refundBrief = `A refund of ₹${formatNumberWithLocalString(parsedRefundAmount)} has been initiated to your original payment method. Transaction ID: ${corporateTxnId}. Remarks: ${remarks}`;
        } else {
            refundBrief = `A refund of ₹${formatNumberWithLocalString(parsedRefundAmount)} has been credited to your wallet. Transaction ID: ${corporateTxnId}. Remarks: ${remarks}`;
        }

        if (customerUsername) {
            try {
                await createNotification({
                    notificationTitle: 'Domain & Hosting Refund Processed',
                    notificationBrief: refundBrief,
                    notificationTo: customerUsername,
                    notificationCategory: 'CORPORATE',
                    notificationBy: 'ADMIN',
                });
            } catch (notifErr) {
                customLog(req?.LogTraceId, 'info', { action: 'processRefund:notification', error: notifErr.message });
            }
        }

        if (customerEmail) {
            try {
                const partnerDetails = customerRegisteredBy
                    ? await fetchPartnerDetails(customerRegisteredBy)
                    : await partnerLogos();
                const { subject, html, sender } = await resolveDomainHostingRefundInitiatedEmail({
                    name: customerName,
                    amount: parsedRefundAmount,
                    transactionId: corporateTxnId,
                    typeOfService: 'Domain & Hosting',
                }, partnerDetails, { partnerId: customerRegisteredBy || null, logTraceId: req?.LogTraceId });
                emailer.email(customerEmail, subject, html, () => {
                    customLog(req?.LogTraceId, 'info', { action: 'processRefund:email', corporateTxnId, customerEmail });
                }, sender);
            } catch (emailErr) {
                customLog(req?.LogTraceId, 'info', { action: 'processRefund:email:error', error: emailErr.message });
            }
        }

        customLog(req?.LogTraceId, 'info', { action: 'processRefund', corporateTxnId, refundAmount: parsedRefundAmount, adminId });

        return res.status(200).json({
            status: true,
            message: `Refund of ₹${parsedRefundAmount} processed successfully`,
            responseCode: '000',
            data: {},
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { action: 'processRefund', error: error.message || error, corporateTxnId });
        if (error.message === 'ALREADY REFUNDED') {
            return next(new ErrorResponse('This order has already been refunded', 400));
        }
        if (error.message === 'NO TRANSACTIONS FOUND') {
            return next(new ErrorResponse('No wallet transaction found for this order', 404));
        }
        return next(new ErrorResponse('Failed to process refund. Please try again.', 500));
    }
});

// ─── Partial Wallet Credit Helper ─────────────────────────────────────────────

async function partialWalletCredit({ corporateTxnId, refundAmount, remarks }) {
    const t = await sequelizeConfig.transaction({ autocommit: false });
    try {
        const originalTxn = await transaction.findOne({
            where: { corporateTxnId },
            raw: true,
        });

        if (!originalTxn) throw new Error('NO TRANSACTIONS FOUND');

        // Prevent double refund — check both status and remarks
        const alreadyRefunded =
            originalTxn.status === 'REFUNDED' ||
            (originalTxn.remarks && originalTxn.remarks.includes('REFUND'));
        if (alreadyRefunded) throw new Error('ALREADY REFUNDED');

        const corporateWallet = await wallet.findOne({
            where: { credentialId: originalTxn.credentialId },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });

        if (!corporateWallet) throw new Error('Wallet not found for this user');

        const newBalance = parseFloat(corporateWallet.balance) + refundAmount;

        await wallet.update(
            { balance: newBalance },
            { where: { credentialId: originalTxn.credentialId }, transaction: t }
        );

        const now = new Date();
        await transaction.create({
            credentialId: originalTxn.credentialId,
            corporateTxnId,
            transactionDate: now,
            transactionType: originalTxn.transactionType,
            transactionCategory: originalTxn.transactionCategory,
            debitAmount: -refundAmount,
            creditAmount: 0,
            totalCashback: 0,
            corporateCashback: 0,
            systemCashback: 0,
            balance: newBalance,
            status: 'REFUNDED',
            remarks: `PARTIAL REFUND - ${remarks}`,
        }, { transaction: t });

        // Mark original transaction as refunded to prevent double-refund
        await transaction.update(
            { status: 'REFUNDED', remarks: 'REFUNDED' },
            {
                where: {
                    corporateTxnId,
                    status: { [Op.ne]: 'REFUNDED' },
                    remarks: { [Op.notLike]: '%REFUND%' },
                },
                transaction: t,
            }
        );

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
}
