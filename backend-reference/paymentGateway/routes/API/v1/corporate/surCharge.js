const express = require('express')
const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require('../../../../utils/error-response');
const { calculateServiceChargesValidation } = require('../../../../utils/queryValidation');
const { getBillerByBillerID, calculateCCF1, isBillPaymentAccessKey, resolveChannelBound,
    resolveInitChannel, toRupeeAmountLimit } = require('../../../../utils/billPayments_utils');
const { customLog } = require('../../../../utils/loggerHelper');
const router = express.Router()

router.get('/', calculateServiceChargesValidation, async function (req, res, next) {
    const credentialId = req.user.id
    const packageId = req.user.packageId
    const accessKey = req.query.accessKey
    const orderAmount = req.query.amount
    const billerId = typeof req.query.billerId === "string" ? req.query.billerId.trim() : req.query.billerId
    const corporateUserId = req.user.corporateId
    const quantity = parseInt(req.query.quantity) || 1 // using for bulk bill payments
    customLog(req?.LogTraceId, "info", {message:" query test log", query: req.query})
    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId
    })
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails['error'], 400))
    }

    function calculateCorporateCashbackWillEarn(orderAmount, quantity) {
        let totalCashback = 0;
        let corporateCashback = serviceDetails.cashback
        if (serviceDetails.commissionType === 'PERCENTAGE') {
            totalCashback = (parseFloat(orderAmount) * parseFloat(serviceDetails.providerCommission / 100)).toFixed(2)
        } else {
            totalCashback = serviceDetails.providerCommission
        }
        if (serviceDetails.cashbackType === "PERCENTAGE") {
            corporateCashback = (parseFloat(totalCashback) * parseFloat(corporateCashback / 100)).toFixed(2)
        } else {
            corporateCashback = corporateCashback * quantity
        }
        return corporateCashback;
    }

    // For bill payment services, fetch CCF1 if billerId provided
    let ccf1Amount = null;
    let ccf1Reason = "Not applicable";
    let amountLimit = { status: 'UNKNOWN', minAmount: null, maxAmount: null };
    if (isBillPaymentAccessKey(accessKey) && billerId) {
        try {
            const billerData = await getBillerByBillerID(billerId, serviceDetails.vendor, req?.LogTraceId);
            if (!billerData) {
                ccf1Reason = "Biller not found in MDM data";
            } else if (!billerData?.interchangeFeeCCF1) {
                ccf1Reason = "interchangeFeeCCF1 is not configured for this biller";
            } else {
                ccf1Reason = "Calculated";
            }
            ccf1Amount = calculateCCF1(billerData, orderAmount);
            if (!ccf1Amount && ccf1Reason === "Calculated") {
                ccf1Reason = "CCF1 calculated as non-positive/invalid for this amount";
            }
            amountLimit = toRupeeAmountLimit(
                resolveChannelBound(billerData, resolveInitChannel(accessKey))
            );
        } catch (e) {
            // CCF1 fetch failure is non-fatal — surcharge still proceeds
            ccf1Reason = "Failed to fetch biller MDM data";
            customLog(req?.LogTraceId, "error", {
                message: "Failed to fetch biller MDM data for CCF1 in surCharge API",
                billerId,
                accessKey,
                error: e?.message || e,
            });
        }
    } else if (isBillPaymentAccessKey(accessKey) && !billerId) {
        ccf1Reason = "billerId is required to calculate CCF1";
    }

    // Surcharge base = bill amount + CCF1 (the true transaction amount)
    const ccf1Rupees = parseFloat(ccf1Amount ?? 0) / 100;
    const surchargeBase = (parseFloat(orderAmount) + ccf1Rupees).toFixed(2);

    const surchargeDetails = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        surchargeBase,
        credentialId,
        quantity
    );

    return res.status(200).json({
        'status': true,
        'data': {
            surcharge: surchargeDetails.surcharge,
            totalSurcharge: surchargeDetails.surchargeWithoutTax,
            corporateCashback: calculateCorporateCashbackWillEarn(orderAmount, quantity),
            ccf1Amount,
            ccf1Reason,
            amountLimit,
        },
        'message': 'Service details fetched successfully',
        'responseCode': '000'
    })
})

module.exports = router