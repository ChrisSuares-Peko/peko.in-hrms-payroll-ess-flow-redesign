'use strict';

const axios = require('axios');
const ServiceCartUseCase = require('../models/use-cases/serviceCart');
const DomainHostingPlansUseCase = require('../models/use-cases/domainHostingPlans');
const { getValue } = require('../utils/cacheDataMethods');
const { resolveDomainHostingPrice } = require('../utils/resolveDomainHostingPrice');
const { customLog } = require('../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const operatorsData = require('../utils/operatorsData.json');

const checkServiceAvailability = async (cartItems, logTraceId) => {
    const domainItems = cartItems.filter(i => i.itemType === 'domain' && i.productName);
    const nonDomainItems = cartItems.filter(i => i.itemType !== 'domain' && i.itemType !== 'backup' && i.domainName && i.productId);

    if (domainItems.length === 0 && nonDomainItems.length === 0) return { available: true };

    const serviceOperator = await findServiceOperatorByAccessKey(operatorsData['domainAndHosting']['accessKey']);
    if (!serviceOperator || serviceOperator.error) {
        customLog(logTraceId, 'info', { action: 'checkServiceAvailability:credentialsMissing' });
        return { available: true }; // non-fatal: allow if credentials unavailable
    }

    const baseUrl = serviceOperator.vendor.apiUrl;
    const authParams = `auth-userid=${encodeURIComponent(serviceOperator.vendor.optional1)}&api-key=${encodeURIComponent(serviceOperator.vendor.optional2)}`;

    // Check availability for domain purchase items
    for (const item of domainItems) {
        const domainName = item.productName;
        try {
            const dotIndex = domainName.indexOf('.');
            if (dotIndex < 1) {
                customLog(logTraceId, 'error', { action: 'checkServiceAvailability:domain:invalidName', domainName });
                return { available: false, domainName };
            }
            const sld = domainName.substring(0, dotIndex);
            const tld = domainName.substring(dotIndex + 1);
            const url = `${baseUrl}/api/domains/available.json?${authParams}&domain-name=${encodeURIComponent(sld)}&tlds=${encodeURIComponent(tld)}`;
            const response = await axios.get(url);
            const result = response.data?.[domainName] ?? response.data?.[domainName.toLowerCase()];
            const isAvailable = result?.status === 'available' || typeof result === 'number';
            customLog(logTraceId, 'info', { action: 'checkServiceAvailability:domain', domainName, isAvailable });
            if (!isAvailable) {
                return { available: false, domainName };
            }
        } catch (err) {
            customLog(logTraceId, 'error', { action: 'checkServiceAvailability:domain:error', domainName, error: err?.response?.data || err.message });
            // non-fatal: allow if availability check fails
        }
    }

    // Check product availability for hosting/vps/email items
    for (const item of nonDomainItems) {
        try {
            const url = `${baseUrl}/api/products/availability.json?${authParams}&domain-name=${encodeURIComponent(item.domainName)}&product-key=${encodeURIComponent(item.productId)}`;
            const response = await axios.get(url);
            const isAvailable = response.data === true || response.data === 'true';
            customLog(logTraceId, 'info', { action: 'checkServiceAvailability', productId: item.productId, domainName: item.domainName, isAvailable });
            if (!isAvailable) {
                return { available: false, productId: item.productId, domainName: item.domainName };
            }
        } catch (err) {
            customLog(logTraceId, 'error', { action: 'checkServiceAvailability:error', productId: item.productId, domainName: item.domainName, error: err?.response?.data || err.message });
            // non-fatal: allow if availability check fails
        }
    }
    return { available: true };
};

const validateDomainHostingWalletAmount = async (req, res, next) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return sendError(res, req.LogTraceId, 'Amount is required');
        }

        const userData = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
            ? { subCorporateUserId: req.user.subCorporateId }
            : { corporateUserId: req.user.corporateId };

        const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);

        if (!cart || cart === -1) {
            return sendError(res, req.LogTraceId, 'Your cart is empty');
        }

        const cartItems = cart.productsArray;

        if (!cartItems || cartItems.length === 0) {
            return sendError(res, req.LogTraceId, 'Your cart is empty');
        }

        // Re-compute expected total from vendor pricing cache — same logic as cart add/update
        const cached = await getValue('reseller_pricing');
        const pricingData = cached ? JSON.parse(cached) : null;

        let calculatedTotal = 0;

        for (const item of cartItems) {
            if (!pricingData) {
                // Cache unavailable — fall back to stored totalPrice
                calculatedTotal += parseFloat(item.totalPrice || 0);
                continue;
            }

            let unitPrice = null;
            let billingMultiplier = 1;

            if (item.itemType === 'domain') {
                unitPrice = resolveDomainHostingPrice(pricingData, item.productId, 'domain', null, item.billingCycle || 1);
                billingMultiplier = item.billingCycle || 1;
            } else {
                const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId: item.productId, planId: item.planId });
                if (!plan) {
                    return sendError(res, req.LogTraceId, 'One or more items in your cart are no longer available. Please refresh your cart.');
                }
                const cycle = item.billingCycle || plan.billingCycle || null;
                unitPrice = resolveDomainHostingPrice(pricingData, plan.productId, plan.planType, plan.planId, cycle);
                if (cycle) billingMultiplier = cycle;
            }

            if (unitPrice == null) {
                // Price not resolvable — fall back to stored totalPrice
                calculatedTotal += parseFloat(item.totalPrice || 0);
                continue;
            }

            const qty = item.productQuantity || 1;
            const addonUnitPrice = parseFloat(item.addonUnitPrice || 0);
            const storageMultiplier = item.itemType === 'backup' ? (item.storageInGb || 1) : 1;
            calculatedTotal += parseFloat(((unitPrice + addonUnitPrice) * qty * billingMultiplier * storageMultiplier).toFixed(2));
        }

        const calculatedAmount = calculatedTotal.toFixed(2);

        // Detect payment type from body
        const isPG = Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse');
        const isRazorPay = Object.prototype.hasOwnProperty.call(req.body, 'razorPay');
        const isPaytm = Object.prototype.hasOwnProperty.call(req.body, 'paytmResponse');

        const pgAmount = isPG ? req.body.pgAmount : isRazorPay ? req.body.razorPayAmount : isPaytm ? req.body.paytmAmount : null;

        customLog(req.LogTraceId, 'info', {
            action: 'validateDomainHostingWalletAmount',
            paymentType: isPG ? 'PG' : isRazorPay ? 'RazorPay' : isPaytm ? 'Paytm' : 'Wallet',
            requestedAmount: Number(amount).toFixed(2),
            ...(pgAmount != null && { pgAmount: Number(pgAmount).toFixed(2) }),
            subtotal: calculatedTotal.toFixed(2),
            calculatedAmount,
        });

        if (Number(amount).toFixed(2) !== calculatedAmount) {
            customLog(req.LogTraceId, 'error', {
                action: 'validateDomainHostingWalletAmount:mismatch',
                field: 'amount',
                requestedAmount: Number(amount).toFixed(2),
                calculatedAmount,
            });
            return sendError(res, req.LogTraceId, 'Amount mismatch');
        }

        if (pgAmount != null && Number(pgAmount).toFixed(2) !== calculatedAmount) {
            customLog(req.LogTraceId, 'error', {
                action: 'validateDomainHostingWalletAmount:mismatch',
                field: 'pgAmount',
                pgAmount: Number(pgAmount).toFixed(2),
                calculatedAmount,
            });
            return sendError(res, req.LogTraceId, 'Payment gateway amount mismatch');
        }

        // Check availability for domains and hosting/vps/email items
        const availability = await checkServiceAvailability(cartItems, req.LogTraceId);
        if (!availability.available) {
            customLog(req.LogTraceId, 'error', { action: 'validateDomainHostingWalletAmount:unavailable', productId: availability.productId, domainName: availability.domainName });
            return sendError(res, req.LogTraceId, `The service for ${availability.domainName} is no longer available. Please update your cart and try again.`);
        }

        return next();
    } catch (error) {
        customLog(req.LogTraceId, 'error', {
            action: 'validateDomainHostingWalletAmount:error',
            error: error.message,
            message: 'Error while validating domain hosting payment amount',
        });
        return sendError(res, req.LogTraceId, 'Something went wrong while validating the amount');
    }
};

function sendError(res, traceId, message, statusCode = 400) {
    customLog(traceId, 'error', { message });
    return res.status(statusCode).json({
        status: false,
        data: {},
        message,
        statusCode: '001',
    });
}

module.exports = validateDomainHostingWalletAmount;
