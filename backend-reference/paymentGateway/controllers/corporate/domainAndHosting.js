'use strict';

const axios = require('axios');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { customLog } = require('../../utils/loggerHelper');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { createNotification } = require('../../models/use-cases/notification');
const { commonFailedTemplate } = require('../../utils/emailTemplates');
const { domainHostingSuccessTemplate } = require('../../utils/emailTemplates/domainAndHosting');
const ServiceCartUseCase = require('../../models/use-cases/serviceCart');
const { findOne: findCorporateUser, updateCorporateDetails } = require('../../models/use-cases/corporateUser');
const { refundGatewayTransaction } = require('../../controllers/corporate/pluralGateway');
const wallet = require('../../models/entities/wallet');
const { updateOneOrder } = require('../../models/use-cases/order');
const operatorsData = require('../../utils/operatorsData.json');
const emailer = require('../../utils/emailer');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { findByVendorKey } = require('../../models/use-cases/domainHostingPlans');

const DOMAIN_NAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');

const accessKey = operatorsData['domainAndHosting']['accessKey'];

// Plan-level commission override: a cart item's own domainHostingPlans row, falling back
// to the service operator's flat commission fields when no matching row exists (e.g. domain items).
const getDomainHostingCommissionFields = (plan, serviceDetails) => plan
    ? {
        commissionMode: plan.commissionMode,
        commissionType: plan.commissionType,
        commission: plan.commission,
        fixedCommissionPerTransaction: plan.fixedCommissionPerTransaction,
        isCommissionInclGST: plan.isCommissionInclGST,
        isCommissionConfigured: plan.isCommissionConfigured,
    }
    : {
        commissionMode: serviceDetails?.commissionMode,
        commissionType: serviceDetails?.commissionType,
        providerCommission: serviceDetails?.providerCommission,
        fixedCommissionPerTransaction: serviceDetails?.fixedCommissionPerTransaction,
        isCommissionInclGST: serviceDetails?.isCommissionInclGST,
        isCommissionConfigured: serviceDetails?.isCommissionConfigured,
    };

// Builds per-item planDetails entries from each cart item's own stored totalPrice.
const buildDomainHostingPlanDetails = async (cartItems, serviceDetails) => {
    const planDetails = [];
    for (const item of cartItems) {
        const plan = item.itemType !== 'domain'
            ? await findByVendorKey({ productId: item.productId, planId: item.planId, billingCycle: item.billingCycle || null })
            : null;

        let quantity = 1;
        let amount = parseFloat(item.totalPrice || 0);

        // quantity = accounts/seats; amount = per-unit price
        if (item.itemType === 'titan_email' || item.itemType === 'google_workspace') {
            quantity = (item.itemType === 'titan_email' ? item.accounts : item.seats) || 1;
            amount = parseFloat((parseFloat(item.totalPrice || 0) / quantity).toFixed(2));
        }

        planDetails.push({
            name: item.itemType === 'domain' ? item.productName : (plan?.planName || item.productId),
            amount,
            quantity,
            ...getDomainHostingCommissionFields(plan, serviceDetails),
        });
    }
    return planDetails;
};

// ─── Query string builder ────────────────────────────────────────────────────
const buildQuery = (params) => {
    let query = '';
    for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
            value.forEach(v => { query += `&${key}=${encodeURIComponent(v)}`; });
        } else {
            query += `&${key}=${encodeURIComponent(value)}`;
        }
    }
    return query.substring(1);
};

// ─── Vendor provisioning helpers ─────────────────────────────────────────────

const provisionDomain = async (baseUrl, authParams, item, logTraceId) => {
    // Staging only: override NS extension to .org for .com and .net domains
    let ns = item.ns;
    if (
        process.env.NODE_ENV === 'staging' &&
        Array.isArray(ns) && ns.length > 0 &&
        (item.domainName.endsWith('.com') || item.domainName.endsWith('.net'))
    ) {
        ns = ns.map(n => n.replace(/\.(com|net)$/, '.org'));
        customLog(logTraceId, 'info', { action: 'provision:domain:stagingNsOverride', original: item.ns, overridden: ns }, 'VENDOR');
    }

    const params = {
        ...authParams,
        'domain-name': item.domainName,
        years: item.years || 1,
        ...(Array.isArray(ns) && ns.length ? { ns } : {}),
        'customer-id': item.customerId,
        'reg-contact-id': item.regContactId,
        'admin-contact-id': item.adminContactId,
        'tech-contact-id': item.techContactId,
        'billing-contact-id': item.billingContactId,
        'invoice-option': item.invoiceOption || 'NoInvoice',
        'purchase-privacy': item.purchasePrivacy ?? false,
        'discount-amount': item.discountAmount ?? 0.0,
        'auto-renew': item.autoRenew ?? false,
    };
    const attrs = item.attrs || {};
    Object.entries(attrs).forEach(([name, value], i) => {
        params[`attr-name${i + 1}`] = name;
        params[`attr-value${i + 1}`] = value;
    });
    const config = { method: 'POST', url: `${baseUrl}/api/domains/register.json?${buildQuery(params)}` };
    customLog(logTraceId, 'info', { action: 'provision:domain:request', url: config.url.replace(authParams['api-key'], '***'), domainName: item.domainName, ns: item.ns, regContactId: item.regContactId }, 'VENDOR');
    const response = await axios(config);
    const result = response.data;
    customLog(logTraceId, 'info', { action: 'provision:domain:response', httpStatus: response.status, result }, 'VENDOR');
    if (result?.status === 'error' || result?.status === 'ERROR') {
        const err = new Error(result.error || result.message || 'Domain registration failed');
        err.vendorResponse = result;
        throw err;
    }
    return result;
};

const resolveHostingEndpoint = (productId) => {
    const p = String(productId || '').toLowerCase();
    const isMulti = p.includes('multidomain');
    const os = p.includes('windows') ? 'windows' : 'linux';
    const location = p.endsWith('in') ? 'in' : 'us';
    const apiType = isMulti ? 'multidomainhosting' : 'singledomainhosting';
    return { apiType, os, location };
};

const provisionHosting = async (baseUrl, authParams, item, logTraceId) => {
    const { apiType, os, location } = resolveHostingEndpoint(item.productId);
    const params = {
        ...authParams,
        'domain-name': item.domainName,
        'customer-id': parseInt(item.customerId),
        months: parseInt(item.months || item.billingCycle) || 1,
        'plan-id': parseInt(item.planId),
        'auto-renew': item.autoRenew ?? false,
        'invoice-option': item.invoiceOption || 'NoInvoice',
        'discount-amount': item.discountAmount ?? 0.0,
        ...(item.enableSsl !== undefined ? { 'enable-ssl': item.enableSsl } : {}),
    };
    const config = { method: 'POST', url: `${baseUrl}/api/${apiType}/${os}/${location}/add.json?${buildQuery(params)}` };
    customLog(logTraceId, 'info', { action: 'provision:hosting:request', url: config.url.replace(authParams['api-key'], '***'), apiType, os, location, domainName: item.domainName }, 'VENDOR');
    const response = await axios(config);
    const result = response.data;
    customLog(logTraceId, 'info', { action: 'provision:hosting:response', httpStatus: response.status, result }, 'VENDOR');
    if (result?.status === 'error' || result?.status === 'ERROR') {
        const err = new Error(result.error || result.message || 'Hosting provisioning failed');
        err.vendorResponse = result;
        throw err;
    }
    return result;
};

const provisionTitanEmail = async (baseUrl, authParams, item, logTraceId) => {
    const params = {
        ...authParams,
        'domain-name': item.domainName,
        'customer-id': parseInt(item.customerId),
        noOfMonths: parseInt(item.months || item.billingCycle) || 1,
        'plan-id': parseInt(item.planId),
        'invoice-option': item.invoiceOption || 'NoInvoice',
        'additional-param-json': JSON.stringify({ no_of_accounts: parseInt(item.noOfAccounts) || 1 }),
    };
    const body = new URLSearchParams(params).toString();
    const config = {
        method: 'POST',
        url: `${baseUrl}/restapi/product/titanmailindia/order`,
        data: body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };
    customLog(logTraceId, 'info', { action: 'provision:titan_email:request', url: config.url, params: params }, 'VENDOR');
    const response = await axios(config);
    const result = response.data;
    customLog(logTraceId, 'info', { action: 'provision:titan_email:response', httpStatus: response.status, result }, 'VENDOR');
    if (result?.status === 'error' || result?.status === 'ERROR') {
        const err = new Error(result.error || result.message || 'Titan email provisioning failed');
        err.vendorResponse = result;
        throw err;
    }
    return result;
};

const provisionGoogleWorkspace = async (baseUrl, authParams, item, logTraceId) => {
    const params = {
        ...authParams,
        'domain-name': item.domainName,
        'customer-id': parseInt(item.customerId),
        months: parseInt(item.months) || 1,
        'no-of-accounts': parseInt(item.noOfAccounts) || 1,
        'invoice-option': item.invoiceOption || 'NoInvoice',
        'plan-id': parseInt(item.planId),
        'discount-amount': item.discountAmount ?? 0.0,
        'is-transfer-in': false,
        ...(item.autoRenew !== undefined ? { 'auto-renew': item.autoRenew } : {}),
    };
    const config = { method: 'POST', url: `${baseUrl}/api/gapps/in/add.json?${buildQuery(params)}` };
    customLog(logTraceId, 'info', { action: 'provision:google_workspace:request', url: config.url.replace(authParams['api-key'], '***'), domainName: item.domainName }, 'VENDOR');
    const response = await axios(config);
    const result = response.data;
    customLog(logTraceId, 'info', { action: 'provision:google_workspace:response', httpStatus: response.status, result }, 'VENDOR');
    if (result?.status === 'error' || result?.status === 'ERROR') {
        const err = new Error(result.error || result.message || 'Google Workspace provisioning failed');
        err.vendorResponse = result;
        throw err;
    }
    return result;
};

// ─── Vendor helper functions ──────────────────────────────────────────────────

const validateDomainAvailability = async (baseUrl, authParams, domainName, logTraceId) => {
    const domainParts = domainName.split('.');
    const name = domainParts[0];
    const tld = domainParts.slice(1).join('.');
    const params = { ...authParams, 'domain-name': name, tlds: tld };
    try {
        const response = await axios.get(`${baseUrl}/api/domains/available.json?${buildQuery(params)}`);
        const result = response.data?.[domainName] || response.data?.[domainName.toLowerCase()];
        const isAvailable = result?.status === 'available' || typeof result === 'number';
        customLog(logTraceId, 'info', { action: 'validateDomainAvailability', domainName, isAvailable, result }, 'VENDOR');
        return isAvailable;
    } catch (err) {
        customLog(logTraceId, 'info', { action: 'validateDomainAvailability', domainName, error: err?.response?.data || err.message }, 'VENDOR');
        return null; // null = couldn't determine, allow provisioning to proceed
    }
};

const fetchCustomerDefaultNS = async (baseUrl, authParams, customerId, logTraceId) => {
    try {
        const params = { ...authParams, 'customer-id': customerId };
        const config = { method: 'GET', url: `${baseUrl}/api/domains/customer-default-ns.json?${buildQuery(params)}` };
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultNS:request', url: config.url.replace(authParams['api-key'], '***'), customerId }, 'VENDOR');
        const response = await axios(config);
        const ns = response.data;
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultNS:response', httpStatus: response.status, ns }, 'VENDOR');
        if (Array.isArray(ns) && ns.length >= 2) return ns;
        return null;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'fetchCustomerDefaultNS:error', httpStatus: err?.response?.status, error: err?.response?.data || err.message }, 'VENDOR');
        return null;
    }
};

const fetchCustomerDefaultContact = async (baseUrl, authParams, customerId, logTraceId) => {
    try {
        const params = { ...authParams, 'customer-id': customerId, 'no-of-records': 1, 'page-no': 1 };
        const config = { method: 'GET', url: `${baseUrl}/api/contacts/search.json?${buildQuery(params)}` };
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultContact:request', url: config.url.replace(authParams['api-key'], '***'), customerId }, 'VENDOR');
        const response = await axios(config);
        const data = response.data;
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultContact:response', httpStatus: response.status, data }, 'VENDOR');
        const recordKey = Object.keys(data).find(k => !isNaN(k));
        const contactId = recordKey ? String(data[recordKey]?.entityid) : null;
        if (!contactId || contactId === 'null' || contactId === 'undefined') return null;
        return contactId;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'fetchCustomerDefaultContact:error', httpStatus: err?.response?.status, error: err?.response?.data || err.message }, 'VENDOR');
        return null;
    }
};

const createContactForCustomer = async (baseUrl, authParams, customerId, logTraceId) => {
    try {
        const detailsParams = { ...authParams, 'customer-id': customerId };
        const detailsResponse = await axios.get(`${baseUrl}/api/customers/details-by-id.json?${buildQuery(detailsParams)}`);
        const customer = detailsResponse.data;
        customLog(logTraceId, 'info', { action: 'createContactForCustomer:details', customerId, customer }, 'VENDOR');
        if (!customer || customer.status === 'ERROR') return null;

        const contactParams = {
            ...authParams,
            'customer-id': customerId,
            name: customer.name || customer.username || 'Unknown',
            company: customer.company || customer.name || 'Unknown',
            email: customer.username || customer.email,
            'address-line-1': customer['address-line-1'] || customer.address1 || 'NA',
            city: customer.city,
            state: customer.state,
            country: customer.country,
            zipcode: customer.zip || customer.zipcode,
            'phone-cc': customer['phone-cc'] || customer.phoneCc || customer['telno-cc'] || customer.telnocc,
            phone: customer.phone || customer.telno,
            type: 'Contact',
        };

        const required = ['name', 'company', 'email', 'address-line-1', 'city', 'state', 'country', 'zipcode', 'phone-cc', 'phone'];
        const missingFields = required.filter(f => !contactParams[f]);
        if (missingFields.length > 0) {
            customLog(logTraceId, 'error', { action: 'createContactForCustomer:missingFields', missingFields, customerId }, 'VENDOR');
            return null;
        }

        const addResponse = await axios.post(`${baseUrl}/api/contacts/add.json?${buildQuery(contactParams)}`);
        const contactId = String(addResponse.data);
        customLog(logTraceId, 'info', { action: 'createContactForCustomer:result', customerId, contactId }, 'VENDOR');
        if (!contactId || contactId === 'null' || contactId === 'undefined' || isNaN(Number(contactId))) return null;
        return contactId;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'createContactForCustomer:error', error: err?.response?.data || err.message }, 'VENDOR');
        return null;
    }
};

const provisionVpsServer = async (baseUrl, authParams, item, logTraceId) => {
    const productIdLower = String(item.productId || '').toLowerCase();
    const location = productIdLower.includes('us') ? 'us' : 'in';
    const params = {
        ...authParams,
        'domain-name': item.domainName,
        'customer-id': parseInt(item.customerId),
        months: parseInt(item.months || item.billingCycle) || 1,
        'plan-id': parseInt(item.planId),
        'auto-renew': false,
        'invoice-option': item.invoiceOption || 'NoInvoice',
        'discount-amount': item.discountAmount ?? 0.0,
        ...(item.os ? { os: item.os } : {}),
        ...(Array.isArray(item.addons) && item.addons.length > 0 ? { addon: item.addons } : {}),
    };
    const config = { method: 'POST', url: `${baseUrl}/api/virtualserver/linux/${location}/add.json?${buildQuery(params)}` };
    customLog(logTraceId, 'info', { action: 'provision:vps_server:request', url: config.url.replace(authParams['api-key'], '***'), location, domainName: item.domainName, 'plan-id': params['plan-id'], os: item.os || null, addons: item.addons || [] }, 'VENDOR');
    const response = await axios(config);
    const result = response.data;
    customLog(logTraceId, 'info', { action: 'provision:vps_server:response', httpStatus: response.status, result }, 'VENDOR');
    if (result?.status === 'error' || result?.status === 'ERROR') {
        const err = new Error(result.error || result.message || 'VPS Server provisioning failed');
        err.vendorResponse = result;
        throw err;
    }
    return result;
};

const provisionItem = async (baseUrl, authParams, item, logTraceId) => {
    customLog(logTraceId, 'info', { action: `provision:${item.itemType}`, domainName: item.domainName }, 'VENDOR');
    switch (item.itemType) {
        case 'domain':           return provisionDomain(baseUrl, authParams, item);
        case 'shared_hosting':   return provisionHosting(baseUrl, authParams, item, logTraceId);
        case 'vps_server':       return provisionVpsServer(baseUrl, authParams, item, logTraceId);
        case 'titan_email':      return provisionTitanEmail(baseUrl, authParams, item, logTraceId);
        case 'google_workspace': return provisionGoogleWorkspace(baseUrl, authParams, item, logTraceId);
        default: throw new Error(`Unknown itemType: ${item.itemType}`);
    }
};

// ─── Payment controller ───────────────────────────────────────────────────────

exports.payment = asyncHandler(async (req, res, next) => {
    const {
        amount: bodyAmount,
        customerId,
        cartId,
        pocName,
        email,
        payCashback,
        invoiceOption = 'NoInvoice',
        autoRenew = false,
        domainDetails = {},
    } = req.body;

    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const emailId = req.user.email;
    const contactPersonName = req.user.contactPersonName;

    // ── 1. Fetch cart ──────────────────────────────────────────────────────────
    const userData = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
        ? { subCorporateUserId: req.user.subCorporateId }
        : { corporateUserId: req.user.corporateId };

    const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
    if (!cart || cart === -1) {
        return next(new ErrorResponse('Your cart is empty.', 400));
    }
    if (cart.cartId !== cartId) {
        return next(new ErrorResponse('Cart not found or has changed. Please refresh your cart and try again.', 400));
    }

    const cartItems = cart.productsArray;

    // ── 2.5. Validate domain name format for domain items ─────────────────────
    for (const item of cartItems) {
        if (item.itemType === 'domain') {
            if (!item.productName || !DOMAIN_NAME_RE.test(item.productName)) {
                customLog(req?.LogTraceId, 'error', { action: 'payment:domainValidation', productName: item.productName, message: 'Invalid or missing domain name' });
                return next(new ErrorResponse(
                    `Invalid domain name in cart. Please remove it and search for a valid domain (e.g. example.com).`,
                    400
                ));
            }
        }
    }

    // ── 2. Service details + surcharge ─────────────────────────────────────────
    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        customLog(req?.LogTraceId, 'error', { action: 'payment:fetchServiceDetails', error: serviceDetails['error'] });
        return next(new ErrorResponse('Unable to process your request. Please try again later.', 400));
    }

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails;
    const amount = Number(bodyAmount).toFixed(2);
    const accountNo = cartItems.find(i => i.itemType === 'domain')?.productName || cartItems[0]?.productName || credentialId;

    const { surcharge } = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const planDetails = await buildDomainHostingPlanDetails(cartItems, serviceDetails);
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount: Number(amount),
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        planDetails,
        credentialId,
    });

    const vendorBaseUrl = serviceDetails.vendor.apiUrl;
    const vendorAuthParams = {
        'auth-userid': serviceDetails.vendor.optional1,
        'api-key': serviceDetails.vendor.optional2,
    };

    // ── 4. Validate non-domain items have domainName ───────────────────────────
    const missingDomain = cartItems.find(i => i.itemType !== 'domain' && !i.domainName);
    if (missingDomain) {
        return next(new ErrorResponse(
            `Domain name is required for ${missingDomain.itemType} (${missingDomain.productId}). Please update your cart before checkout.`,
            400
        ));
    }

    // ── 4.5. Pre-flight: resolve default NS and contact for domain items ────────
    const hasDomainItems = cartItems.some(i => i.itemType === 'domain');
    let defaultNS = null;
    let fallbackContactId = null;

    if (hasDomainItems) {
        // Re-validate domain availability before charging
        for (const item of cartItems) {
            if (item.itemType === 'domain') {
                const isAvailable = await validateDomainAvailability(vendorBaseUrl, vendorAuthParams, item.productName, req?.LogTraceId);
                if (isAvailable === false) {
                    return next(new ErrorResponse(
                        `"${item.productName}" is no longer available. Please remove it from your cart and search again.`,
                        400
                    ));
                }
            }
        }

        const needsNS = cartItems.some(i => i.itemType === 'domain' && !domainDetails[i.productName]?.ns);
        const needsContact = cartItems.some(i => i.itemType === 'domain' && !domainDetails[i.productName]?.regContactId);

        customLog(req?.LogTraceId, 'info', { action: 'payment:domainPreflight', customerId, needsNS, needsContact });

        if (needsNS) {
            defaultNS = await fetchCustomerDefaultNS(vendorBaseUrl, vendorAuthParams, customerId, req?.LogTraceId);
            if (!defaultNS) {
                return next(new ErrorResponse('Default nameservers are not configured. Please provide nameservers in domainDetails or configure default NS in your reseller panel.', 400));
            }
        }

        if (needsContact) {
            // Check cached contact ID in DB first to avoid vendor API call on every purchase
            const corporateUserRecord = await findCorporateUser({ id: credentialId }, ['domainHostingMeta']);
            const existingMeta = corporateUserRecord?.domainHostingMeta || {};
            fallbackContactId = existingMeta.contactId || null;

            if (!fallbackContactId) {
                fallbackContactId = await fetchCustomerDefaultContact(vendorBaseUrl, vendorAuthParams, customerId, req?.LogTraceId);
                if (!fallbackContactId) {
                    customLog(req?.LogTraceId, 'info', { action: 'payment:contact', message: 'No contact found — auto-creating from customer details', customerId });
                    fallbackContactId = await createContactForCustomer(vendorBaseUrl, vendorAuthParams, customerId, req?.LogTraceId);
                }
                if (fallbackContactId) {
                    await updateCorporateDetails({ id: credentialId }, { domainHostingMeta: { ...existingMeta, contactId: fallbackContactId } });
                    customLog(req?.LogTraceId, 'info', { action: 'payment:contact', message: 'Contact ID cached', credentialId, fallbackContactId });
                }
            } else {
                customLog(req?.LogTraceId, 'info', { action: 'payment:contact', message: 'Using cached contact ID', credentialId, fallbackContactId });
            }

            if (!fallbackContactId) {
                return next(new ErrorResponse('Could not resolve contact details for domain registration. Please provide regContactId in domainDetails.', 400));
            }
        }

        customLog(req?.LogTraceId, 'info', { action: 'payment:domainPreflight:resolved', defaultNS, fallbackContactId });
    }

    // ── 5. Process payment (wallet / PG) ───────────────────────────────────────
    const transactionId = req.body.corporateTxnId || new Date().valueOf();
    const corporateTxnId = transactionId;
    let transactionResponse = {};

    const commonParams = {
        providerId: transactionId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo,
        transactionCategory: 'Other',
        orderAmount: amount,
        commissionType,
        cashbackType,
        providerCommission,
        payCashback,
        surcharge,
        reportData,
    };

    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({
            ...commonParams,
            pgAmount: req.body.pgAmount,
            pgResponse: req.body.paymentGatewayResponse,
            couponCode: req.body.couponCode,
            corporateUserId,
            partnerId: req.user.registeredBy,
            accessKey,
            ...(req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
                ? { subCorporateUserId: req.user.subCorporateId }
                : {}),
        });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount, reportData });
    }

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        customLog(req?.LogTraceId, 'error', { action: 'payment:createTransaction', error: transactionResponse['error'], corporateTxnId });
        return next(new ErrorResponse('Payment could not be processed. Please try again later.', 500));
    }

    if (reportData) {
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type: 'payment',
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req?.user?.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    }

    // Store cartItems early so product details are visible even if final update fails
    await updateOneOrder(corporateTxnId, { orderResponse: JSON.stringify({ cartItems }) });

    // ── 6. Build vendor items + provision ──────────────────────────────────────
    const vendorItems = cartItems.map(item => {
        if (item.itemType === 'domain') {
            const d = domainDetails[item.productName] || {};
            const resolvedContactId = d.regContactId || fallbackContactId;
            return {
                itemType: 'domain',
                domainName: item.productName,
                customerId,
                years: item.billingCycle || d.years || 1,
                ns: d.ns || defaultNS,
                regContactId: resolvedContactId,
                adminContactId: d.adminContactId || resolvedContactId,
                techContactId: d.techContactId || resolvedContactId,
                billingContactId: d.billingContactId || resolvedContactId,
                purchasePrivacy: d.purchasePrivacyProtection ?? false,
                discountAmount: d.discountAmount ?? 0.0,
                attrs: d.attrs || {},
                invoiceOption,
                autoRenew,
            };
        }
        return {
            itemType: item.itemType,
            domainName: item.domainName,
            customerId,
            productId: item.productId,
            planId: item.planId,
            months: item.billingCycle || 1,
            noOfAccounts: item.accounts || item.seats || item.productQuantity || 1,
            invoiceOption,
            autoRenew,
            ...(item.os ? { os: item.os } : {}),
            ...((() => {
                let addons = Array.isArray(item.addons) ? [...item.addons] : [];
                if (item.controlPanel && item.controlPanel !== 'none' && !addons.includes(item.controlPanel)) {
                    addons.push(item.controlPanel);
                }
                return addons.length > 0 ? { addons } : {};
            })()),
        };
    });

    const provisionResults = [];
    let provisionFailed = false;
    let failedItem = null;

    for (const item of vendorItems) {
        try {
            const result = await provisionItem(vendorBaseUrl, vendorAuthParams, item, req?.LogTraceId);
            customLog(req?.LogTraceId, 'info', { action: `provision:${item.itemType}:success`, result }, 'VENDOR');
            provisionResults.push({ itemType: item.itemType, domainName: item.domainName, status: 'SUCCESS', result });
        } catch (err) {
            const vendorResponse = err?.vendorResponse || err?.response?.data || null;
            customLog(req?.LogTraceId, 'error', {
                action: `provision:${item.itemType}:failed`,
                itemType: item.itemType,
                domainName: item.domainName,
                errorMessage: err.message,
                vendorResponse,
                httpStatus: err?.response?.status || null,
                url: err?.config?.url || null,
            }, 'VENDOR');
            provisionResults.push({ itemType: item.itemType, domainName: item.domainName, status: 'FAILURE' });
            provisionFailed = true;
            failedItem = item;
            break;
        }
    }

    // ── 7. Update order + refund if provisioning failed ────────────────────────
    let updateDetails = {};

    if (provisionFailed) {
        updateDetails = {
            corporateTxnId,
            status: 'FAILURE',
            providerId: 'Not Available',
            message: `Provisioning failed for ${failedItem?.itemType} — ${failedItem?.domainName}`,
            registeredById: req.user.registeredBy,
        };
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
            if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
                await refundWalletTransaction(updateDetails);
                if (reportData) {
                    publishJournalEvent(
                        {
                            transactionRef: corporateTxnId,
                            type: 'refund',
                            contextSnapshot: {
                                credentialId,
                                vendor: serviceDetails?.vendor || null,
                                registeredBy: req?.user?.registeredBy || null,
                            },
                            reportData,
                        },
                        req?.LogTraceId
                    );
                }
            }
        } else {
            await refundWalletTransaction(updateDetails);
            if (reportData) {
                publishJournalEvent(
                    {
                        transactionRef: corporateTxnId,
                        type: 'refund',
                        contextSnapshot: {
                            credentialId,
                            vendor: serviceDetails?.vendor || null,
                            registeredBy: req?.user?.registeredBy || null,
                        },
                        reportData,
                    },
                    req?.LogTraceId
                );
            }
        }
    } else {
        updateDetails = {
            corporateTxnId,
            providerId: provisionResults.map(r => r.result?.entityid || r.result?.orderId || 'N/A').join(', '),
            status: 'SUCCESS',
            message: 'Payment Successful',
            orderResponse: JSON.stringify({ cartItems, provisionResults, pocName, email }),
        };
        await ServiceCartUseCase.clearCart(userData);
    }

    await updateWalletTransaction(updateDetails);

    const grossOrderTotal = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2);
    const couponDisc = parseFloat(transactionResponse?.couponDiscount || 0);
    const paidAmountDisplay =
        couponDisc > 0
            ? (parseFloat(amount) + parseFloat(surcharge) - couponDisc).toFixed(2)
            : grossOrderTotal;

    if (provisionFailed) {
        const serviceUrl = partnerDetails?.baseUrl;

        emailer.email({ to: emailId, subject: 'Payment failed', body: commonFailedTemplate(contactPersonName, 'Domain & Hosting', serviceUrl, partnerDetails) }, () => {
            customLog(req?.LogTraceId, 'info', { message: `Failure email sent to ${emailId}` });
        });

        createNotification({
            notificationTitle: 'Domain & Hosting - Payment unsuccessful',
            notificationBrief: `Payment of ₹${grossOrderTotal} was unsuccessful. Transaction ID: ${corporateTxnId}.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] });
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: { corporateFinalBalance: walletDetails?.['balance'] },
            responseCode: '001',
        });
    }

    createNotification({
        notificationTitle: 'Domain & Hosting - Payment successful',
        notificationBrief: `Payment of ₹${paidAmountDisplay} was successful. Transaction ID: ${corporateTxnId}.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN',
    });

    const subject = 'Domain & Hosting Purchase Successful';
    const body = domainHostingSuccessTemplate(pocName || contactPersonName, corporateTxnId, paidAmountDisplay, provisionResults, partnerDetails);

    const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount,
        surcharge,
        couponDiscount: couponDisc,
        corporateTxnId,
        orderId: transactionResponse.orderId,
        paymentType: 'Domain & Hosting',
        credentialId,
        pgAmount: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse') ? req.body.pgAmount : null,
        paymentMethod: pgResponse?.payment_method,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
    });

    emailer.emailWithMultipleAttachment(email || emailId, subject, body, invoiceAttachments, null, (emailErr) => {
        if (emailErr) customLog(req?.LogTraceId, 'error', { message: 'Error sending email', error: emailErr?.message });
    });

    return res.status(200).json({
        status: true,
        message: 'Payment successful',
        responseCode: '000',
        data: {
            corporateTxnId,
            provisionResults,
            totalAmount: paidAmountDisplay,
            grossOrderTotal,
            ...(couponDisc > 0 && { couponDiscount: couponDisc }),
        },
    });
});
