const asyncHandler = require('../../middlewares/async');
const crypto = require('crypto');
const { setValue, getValue } = require('../../utils/cacheDataMethods');
const ErrorResponse = require('../../utils/error-response');
const axios = require('axios');
const operatorsData = require("../../utils/operatorsData.json");
const { buildQuery, resolveHostingEndpoint, ORDER_DETAIL_RESOLVERS } = require('../../utils/domainHostingResolvers');
const { fetchServiceDetails, findServiceOperatorByAccessKey, calculateSurcharge, calculateAmountWithTax } = require('../../utils/checkAndFetchServiceDetails');
const DomainHostingPlansUseCase = require('../../models/use-cases/domainHostingPlans');
const { resolveDomainHostingPrice, resolvePlanPricingDetails, getValidDomainYears } = require('../../utils/resolveDomainHostingPrice');
const ServiceCartUseCase = require('../../models/use-cases/serviceCart');
const { PASSWORD_GEN_DIGIT_CHARS } = require('../../utils/constants');
const { customLog } = require('../../utils/loggerHelper');
const { getPricingData } = require('../../utils/domainHostingPricingCache');
const { getTldList, decodePunycodeTld } = require('../../utils/domainTldCache');
const { getASetting } = require('../../models/use-cases/setting');
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { findDomainHostingOrders, findDomainHostingOrderByTxnId, updateOrder, findOneOrder } = require('../../models/use-cases/order');
const { generateOrderInvoiceAttachments } = require('../../services/invoiceAndReceipt');
const { createRazorPayTransaction } = require('../../utils/dapiTransaction');
const { createPGTransaction, createPaytmTransaction } = require('../../utils/pamentGatewayTransaction');
const { refundGatewayTransaction } = require('../../controllers/corporate/pluralGateway');
const wallet = require('../../models/entities/wallet');
const { createNotification } = require('../../models/use-cases/notification');
const emailer = require('../../utils/emailer');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { updateCorporateDetails, findOne: findCorporateUser } = require('../../models/use-cases/corporateUser');
const { resolvePaymentFailedEmail } = require('../../utils/emailTemplates/common');
const { resolveDomainHostingSuccessEmail } = require('../../utils/emailTemplates/domainAndHosting');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { EMAIL_TEMPLATE_SERVICES, EMAIL_TEMPLATE_KEYS } = require('../../utils/emailTemplateKeys');
const accessKey = operatorsData["domainAndHosting"]["accessKey"];

// Plan-level commission override: a cart item's own domainHostingPlans row, falling back
// to the service operator's flat commission fields when no matching row exists (e.g. domain items).
const getDomainHostingCommissionFields = (plan, serviceDetails) => plan
    ? {
        commissionMode: plan.commissionMode,
        commissionType: plan.commissionType,
        commission: plan.commission,
        fixedCommissionPerTransaction: plan.fixedCommissionPerTransaction,
        isCommissionInclGST: plan.isCommissionInclGST,
    }
    : {
        commissionMode: serviceDetails?.commissionMode,
        commissionType: serviceDetails?.commissionType,
        providerCommission: serviceDetails?.providerCommission,
        fixedCommissionPerTransaction: serviceDetails?.fixedCommissionPerTransaction,
        isCommissionInclGST: serviceDetails?.isCommissionInclGST,
    };

// Builds per-item planDetails entries from each cart item's own stored totalPrice.
const buildDomainHostingPlanDetails = async (cartItems, serviceDetails) => {
    const planDetails = [];
    for (const item of cartItems) {
        const plan = item.itemType !== 'domain'
            ? await DomainHostingPlansUseCase.findByVendorKey({ productId: item.productId, planId: item.planId, billingCycle: item.billingCycle || null })
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


exports.searchDomains = asyncHandler(async (req, res, next) => {
    try {
        const { domainName } = req.body;
        const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;

        customLog(req?.LogTraceId, "info", { action: "searchDomains", domainName });

        if (!domainName) {
            return next(new ErrorResponse("Provide enter a valid domain name", 400));
        }

        // Parse TLD from input or default to .com
        let searchName, requestedTld;
        if (domainName.includes('.')) {
            const dotIndex = domainName.indexOf('.');
            searchName = domainName.substring(0, dotIndex);
            requestedTld = domainName.substring(dotIndex + 1).toLowerCase();
        } else {
            searchName = domainName;
            requestedTld = 'com';
        }

        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId,
          });
          if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return next(new ErrorResponse(serviceDetails.error, 400));
          }

        const baseUrl = serviceDetails.vendor.apiUrl;

        const buildQuery = (params) => {
            let query = "";
            for (const key in params) {
                const value = params[key];

                if (Array.isArray(value)) {
                    value.forEach(v => {
                        query += `&${key}=${encodeURIComponent(v)}`;
                    });
                } else {
                    query += `&${key}=${encodeURIComponent(value)}`;
                }
            }
            return query.substring(1);
        };

        const authParams = {
            "auth-userid": serviceDetails.vendor.optional1,
            "api-key": serviceDetails.vendor.optional2
        };

        customLog(req?.LogTraceId, "info", {
            action: "searchDomains:vendorConfig",
            baseUrl,
            authUserId: serviceDetails.vendor.optional1,
        }, "VENDOR");

        const pricingData = await getPricingData(req?.LogTraceId);

        const popularTlds = await getTldList(req?.LogTraceId);
        const searchTlds = [...new Set([requestedTld, ...popularTlds])];

        const availabilityParams = {
            ...authParams,
            "domain-name": searchName,
            tlds: searchTlds,
            "key-word": searchName
        };

        const availabilityQuery = buildQuery(availabilityParams);
        const availabilityUrl = `${baseUrl}/api/domains/available.json?${availabilityQuery}`;
        customLog(req?.LogTraceId, "info", {
            action: "searchDomains:checkAvailability:request",
            url: availabilityUrl.replace(authParams["api-key"], "***"),
            domainName,
            tldCount: searchTlds.length,
        }, "VENDOR");
        const availabilityResponse = await axios.get(availabilityUrl);
        const availabilityData = availabilityResponse.data || {};
        customLog(req?.LogTraceId, "info", {
            action: "searchDomains:checkAvailability:response",
            httpStatus: availabilityResponse.status,
            resultCount: Object.keys(availabilityData).length,
            result: availabilityData,
        }, "VENDOR");

        const exactMatch = [];
        const suggestions = [];

        const baseName = searchName.toLowerCase();

        Object.entries(availabilityData).forEach(([domain, details]) => {
            let isAvailable = false;
            let price = null;
            let registrationYears = null;

            if (details && typeof details === 'object' && details.status) {
                isAvailable = details.status === "available";
                if (isAvailable && details.classkey) {
                    // Some TLDs (e.g. .ai) have a multi-year minimum registration,
                    // so year "1" may not exist — use the lowest priced year.
                    const validYears = getValidDomainYears(pricingData, details.classkey);
                    if (validYears?.length) {
                        price = validYears[0].price;
                        registrationYears = validYears[0].years;
                    }
                }
            } else if (typeof details === 'string' || typeof details === 'number') {
                isAvailable = true;
                price = parseFloat(details);
            }

            // Convert punycode TLDs (xn--...) to unicode for display (e.g. xn--p1ai → рф)
            const tldPart = domain.includes('.') ? domain.split('.').slice(1).join('.') : '';
            const displayDomain = tldPart.startsWith('xn--')
                ? (() => { const decoded = decodePunycodeTld(tldPart); return decoded ? `${baseName}.${decoded}` : domain; })()
                : domain;

            const domainRecord = {
                domain,
                displayDomain,
                available: isAvailable,
                classkey: details.classkey,
                price,
                ...(registrationYears && registrationYears > 1 ? { registrationYears } : {})
            };

            // .com is pinned to the top of suggestions — except when the user explicitly searched .com,
            // in which case it is the exact match (and must show even when it is unavailable).
            const isComDomain = domain === `${baseName}.com`;
            const isRequestedExact = domain === `${baseName}.${requestedTld}` || domain === domainName.toLowerCase();
            const isExactMatch = isRequestedExact && (requestedTld === 'com' || !isComDomain);

            if (isExactMatch) {
                exactMatch.push(domainRecord);
            } else if (isAvailable) {
                if (isComDomain) {
                    suggestions.unshift(domainRecord); // pin .com to the top
                } else {
                    suggestions.push(domainRecord);
                }
            }
        });

        // Sort suggestions so admin-configured popular TLDs appear first
        const configuredTlds = await getASetting("popular_domain_tlds") || ["com", "in", "net", "org", "io", "co"];
        suggestions.sort((a, b) => {
            const tldA = a.domain.includes('.') ? a.domain.split('.').slice(1).join('.') : '';
            const tldB = b.domain.includes('.') ? b.domain.split('.').slice(1).join('.') : '';
            const idxA = configuredTlds.indexOf(tldA);
            const idxB = configuredTlds.indexOf(tldB);
            const rankA = idxA === -1 ? configuredTlds.length : idxA;
            const rankB = idxB === -1 ? configuredTlds.length : idxB;
            return rankA - rankB;
        });

        const targetPremiumDomain = `${searchName}.${requestedTld}`;

        const premiumCheckParams = {
            ...authParams,
            "domain-name": targetPremiumDomain
        };

        const premiumCheckQuery = buildQuery(premiumCheckParams);
        const premiumCheckUrl = `${baseUrl}/api/domains/premium-check.json?${premiumCheckQuery}`;

        customLog(req?.LogTraceId, "info", {
            action: "searchDomains:premiumCheck:request",
            url: premiumCheckUrl.replace(authParams["api-key"], "***"),
            domain: targetPremiumDomain,
        }, "VENDOR");
        const premiumCacheKey = `premium_check_${targetPremiumDomain}`;
        const PREMIUM_CACHE_TTL = 60 * 60 * 12 * 10 ; 
        let premiumData = null;
        try {
            const cachedPremium = await getValue(premiumCacheKey);
            if (cachedPremium) {
                premiumData = JSON.parse(cachedPremium);
                customLog(req?.LogTraceId, "info", { action: "searchDomains:premiumCheck:cacheHit", domain: targetPremiumDomain }, "VENDOR");
            } else {
                const premiumResponse = await axios.get(premiumCheckUrl);
                premiumData = premiumResponse.data;
                customLog(req?.LogTraceId, "info", {
                    action: "searchDomains:premiumCheck:response",
                    httpStatus: premiumResponse.status,
                    result: premiumData,
                }, "VENDOR");
                await setValue(premiumCacheKey, PREMIUM_CACHE_TTL, JSON.stringify(premiumData));
            }
        } catch (err) {
            customLog(req?.LogTraceId, "error", {
                action: "searchDomains:premiumCheck:error",
                httpStatus: err?.response?.status,
                error: err?.response?.data || err.message,
            }, "VENDOR");
        }

        // If the exact-match domain is premium, mark it as unavailable (premium purchase not supported)
        if (premiumData?.premium === "true") {
            for (const record of exactMatch) {
                if (record.domain === targetPremiumDomain) {
                    record.status = 'unavailable';
                    record.available = false;
                    break;
                }
            }
        }

        return res.status(200).json({
            status: true,
            data: {
                searchTerm: domainName,
                exactMatch,
                suggestions,
                premium: premiumData,
                popularTlds: configuredTlds
            }
        });

    } catch (error) {
        customLog(req?.LogTraceId, "error", { action: "searchDomains", error: error?.response?.data || error.message }, "VENDOR");
        return next(new ErrorResponse("Domain search failed", 500));
    }
});

exports.registerCustomer = asyncHandler(async (req, res, next) => {
    try {
        const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;

        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId,
          });
          if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return next(new ErrorResponse(serviceDetails.error, 400));
          }

        const baseUrl = serviceDetails.vendor.apiUrl;

        const {
            username,
            name,
            company,
            addressLine1,
            city,
            state,
            zipcode,
            phone,
            langPref = "en"
        } = req.body;

        // Country and phone country code are fixed to India — not collected from the client.
        const country = "IN";
        const phoneCc = "91";

        if (!username || !name || !company || !addressLine1 || !city || !state || !zipcode || !phone) {
            return next(new ErrorResponse("Please provide all required customer details", 400));
        }

        // Generate a password that meets vendor policy:
        // 9–16 chars, 1+ lowercase, 1+ uppercase, 1+ digit, 1+ special (~*!@$#%_+.?:,{})
        const generatePassword = () => {
            const lower = 'abcdefghijklmnopqrstuvwxyz';
            const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const digits = PASSWORD_GEN_DIGIT_CHARS;
            const special = '~*!@$#%_+.?:,{}';
            const all = lower + upper + digits + special;
            const rand = (chars) => chars[crypto.randomInt(chars.length)];
            // Guarantee one of each required type, fill rest randomly, then shuffle
            const required = [rand(lower), rand(upper), rand(digits), rand(special)];
            const rest = Array.from({ length: 8 }, () => rand(all));
            return [...required, ...rest]
                .sort(() => crypto.randomInt(2) - 0.5)
                .join('');
        };
        const passwd = generatePassword();

        const buildQuery = (params) => {
            let query = "";
            for (const key in params) {
                query += `&${key}=${encodeURIComponent(params[key])}`;
            }
            return query.substring(1);
        };

        const signupParams = {
            "auth-userid": serviceDetails.vendor.optional1,
            "api-key": serviceDetails.vendor.optional2,
            username: username,
            passwd: passwd,
            name: name,
            company: company,
            "address-line-1": addressLine1,
            city: city,
            state: state,
            country: country,
            zipcode: zipcode,
            "phone-cc": phoneCc,
            phone: phone,
            "lang-pref": langPref
        };

        const signupQuery = buildQuery(signupParams);
        const signupUrl = `${baseUrl}/api/customers/v2/signup.json?${signupQuery}`;

        customLog(req?.LogTraceId, "info", { action: "registerCustomer", username, company }, "VENDOR", ["passwd", "api-key"]);
        const signupResponse = await axios.post(signupUrl);
        const customerId = signupResponse.data;
        customLog(req?.LogTraceId, "info", { action: "registerCustomer", result: customerId }, "VENDOR");

        // Save vendor customer ID + credentials in domainHostingMeta (single DB write)
        const vendorCustomerId = String(customerId);
        if (vendorCustomerId && !isNaN(Number(vendorCustomerId))) {
            const existingMeta = (await findCorporateUser({ id: corporateUserId }, ['domainHostingMeta']))?.domainHostingMeta || {};
            const response = await updateCorporateDetails({ id: corporateUserId }, {
                domainHostingMeta: { ...existingMeta, customerId: vendorCustomerId, username, passwd }
            });
            customLog(req?.LogTraceId, "info", { response, action: "registerCustomer:savedCustomerDetails", corporateUserId, vendorCustomerId });
        }

        return res.status(200).json({
            status: true,
            data: {customerId},
            responseCode: "000",
            message: "Customer Registered successfully"
        });

    } catch (error) {
        const vendorError = error?.response?.data;
        customLog(req?.LogTraceId, "error", { action: "registerCustomer", error: vendorError || error.message }, "VENDOR");
        if (vendorError?.status === 'ERROR' && vendorError?.message) {
            return next(new ErrorResponse(vendorError.message, 409));
        }
        return next(new ErrorResponse("Failed to register customer", 500));
    }
});

exports.loginCustomer = asyncHandler(async (req, res, next) => {
    try {
        const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;

        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return next(new ErrorResponse(serviceDetails.error, 400));
        }

        const baseUrl = serviceDetails.vendor.apiUrl;

        const { username, passwd } = req.body;

        if (!username || !passwd) {
            return next(new ErrorResponse("username and passwd are required", 400));
        }

        const buildQuery = (params) => {
            let query = "";
            for (const key in params) {
                query += `&${key}=${encodeURIComponent(params[key])}`;
            }
            return query.substring(1);
        };

        const loginParams = {
            "auth-userid": serviceDetails.vendor.optional1,
            "api-key": serviceDetails.vendor.optional2,
            username,
            passwd: passwd
        };

        const loginQuery = buildQuery(loginParams);
        const loginUrl = `${baseUrl}/api/customers/authenticate.json?${loginQuery}`;

        customLog(req?.LogTraceId, "info", { action: "loginCustomer", username }, "VENDOR", ["passwd", "api-key"]);
        const loginResponse = await axios.get(loginUrl);
        const loginData = loginResponse.data;
        customLog(req?.LogTraceId, "info", { action: "loginCustomer", result: loginData }, "VENDOR");

        // Store customer ID only if not already saved
        const vendorCustomerId = String(loginData?.customerid || '');
        if (vendorCustomerId && !isNaN(Number(vendorCustomerId))) {
            const existing = await findCorporateUser({ id: credentialId }, ['domainHostingMeta']);
            if (!existing?.domainHostingMeta?.customerId) {
                const existingMeta = existing?.domainHostingMeta || {};
                await updateCorporateDetails({ id: corporateUserId }, { domainHostingMeta: { ...existingMeta, customerId: vendorCustomerId } });
                customLog(req?.LogTraceId, "info", { action: "loginCustomer:savedCustomerId", corporateUserId, vendorCustomerId });
            }
        }

        return res.status(200).json({
            status: true,
            data: loginData,
            responseCode: "000",
            message: "Customer authenticated successfully"
        });

    } catch (error) {
        const vendorError = error?.response?.data;
        customLog(req?.LogTraceId, "error", { action: "loginCustomer", error: vendorError || error.message }, "VENDOR");
        if (vendorError?.status === 'ERROR' && vendorError?.message) {
            return next(new ErrorResponse(vendorError.message, 401));
        }
        return next(new ErrorResponse("Failed to authenticate customer", 500));
    }
});

exports.generateSsoLogin = asyncHandler(async (req, res, next) => {
    try {
        const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;

        const serviceDetails = await fetchServiceDetails({
            credentialId,
            accessKey,
            packageId,
            corporateUserId,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return next(new ErrorResponse(serviceDetails.error, 400));
        }

        const baseUrl = serviceDetails.vendor.apiUrl;
        // Portal URL for SSO redirect — stored in optional3 of the vendor config
        const portalUrl = serviceDetails.vendor.optional3;

        if (!portalUrl) {
            return next(new ErrorResponse("SSO portal URL is not configured", 500));
        }

        let { username, passwd } = req.body;

        // Fall back to credentials stored in domainHostingMeta during registration
        if (!username || !passwd) {
            const userRecord = await findCorporateUser({ id: credentialId }, ['domainHostingMeta']);
            const meta = userRecord?.domainHostingMeta || {};
            username = username || meta.username;
            passwd = passwd || meta.passwd;
        }

        if (!username || !passwd) {
            return next(new ErrorResponse("Customer credentials not found. Please register first.", 400));
        }

        // Client IP — used by vendor to bind the token to the request origin
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.socket?.remoteAddress
            || '0.0.0.0';

        const tokenParams = new URLSearchParams({
            "auth-userid": serviceDetails.vendor.optional1,
            "api-key": serviceDetails.vendor.optional2,
            username,
            passwd,
            ip: clientIp,
        });

        const tokenUrl = `${baseUrl}/api/customers/generate-token.json?${tokenParams.toString()}`;

        customLog(req?.LogTraceId, "info", { action: "generateSsoLogin:request", username, ip: clientIp }, "VENDOR", ["passwd", "api-key"]);
        const tokenResponse = await axios.get(tokenUrl);
        const token = tokenResponse.data;
        customLog(req?.LogTraceId, "info", { action: "generateSsoLogin:response", status: typeof token === 'string' ? 'token_received' : token?.status }, "VENDOR");

        if (!token || typeof token !== 'string') {
            const vendorMsg = token?.message;
            customLog(req?.LogTraceId, "error", { action: "generateSsoLogin", error: vendorMsg || "token not a string", token }, "VENDOR");
            return next(new ErrorResponse("Your account is having some issues. Please contact support.", 401));
        }

        // Replace {{tokengenerated}} placeholder in the portal URL template with the actual token
        const redirectUrl = portalUrl.replace('{{tokengenerated}}', encodeURIComponent(token));

        return res.status(200).json({
            status: true,
            data: { redirectUrl },
            responseCode: "000",
            message: "SSO token generated successfully",
        });

    } catch (error) {
        const vendorError = error?.response?.data;
        customLog(req?.LogTraceId, "error", { action: "generateSsoLogin", error: vendorError || error.message }, "VENDOR");
        return next(new ErrorResponse("Your account is having some issues. Please contact support.", 500));
    }
});

const PLAN_TYPE_LABELS = {
    vps_server: 'VPS Server',
    shared_hosting: 'Shared Hosting',
    titan_email: 'Titan Email',
    google_workspace: 'Google Workspace',
    backup: 'Backup',
};

exports.getHostingServices = asyncHandler(async (req, res, next) => {
    let plans;
    try {
        plans = await DomainHostingPlansUseCase.getActivePlans();
    } catch (err) {
        return next(new ErrorResponse('Failed to fetch hosting services', 500));
    }

    if (!plans || plans.length === 0) {
        return res.status(200).json({ status: true, data: [], message: 'No active services found', responseCode: '000' });
    }

    const grouped = {};
    for (const plan of plans) {
        if (!plan.planType) continue;
        if (!grouped[plan.planType]) grouped[plan.planType] = [];
        grouped[plan.planType].push(plan);
    }

    let pricingData = null;
    try {
        pricingData = await getPricingData(req?.LogTraceId);
    } catch (err) {
        customLog(req?.LogTraceId, 'info', { action: 'getHostingServices:fetchPricing', message: 'Pricing unavailable', error: err?.message });
    }

    const services = [];

    for (const [planType, typePlans] of Object.entries(grouped)) {
        let startingPrice = null;

        for (const plan of typePlans) {
            if (!plan.productId) continue;
            if (pricingData) {
                try {
                    const addPrice = resolveDomainHostingPrice(pricingData, plan.productId, plan.planType, plan.planId, plan.billingCycle);
                    if (addPrice !== null && addPrice > 0 && (startingPrice === null || addPrice < startingPrice)) {
                        startingPrice = addPrice;
                    }
                } catch { /* single plan failure must not break response */ }
            }
        }

        if (startingPrice === null) continue;
        services.push({
            planType,
            label: PLAN_TYPE_LABELS[planType] || planType,
            startingPrice,
        });
    }

    return res.status(200).json({
        status: true,
        data: services,
        message: 'Hosting services fetched successfully',
        responseCode: '000'
    });
});

const fetchVendorPlanDetails = async (baseUrl, authParams, planType, productId, logTraceId) => {
    if (!productId) return null;
    const cacheKey = `plan_details_${planType}_${productId}`;
    try {
        const cached = await getValue(cacheKey);
        if (cached) return JSON.parse(cached);

        const params = { ...authParams, 'product-key': productId };
        const response = await axios.get(`${baseUrl}/api/products/plan-details.json?${buildQuery(params)}`);
        const data = response.data;

        if (data && data.status !== 'ERROR') {
            await setValue(cacheKey, 60 * 60 * 12, JSON.stringify(data));
        }
        return data;
    } catch (err) {
        customLog(logTraceId, 'info', { action: 'fetchVendorPlanDetails', planType, productId, error: err?.response?.data || err.message });
        return null;
    }
};

exports.getHostingPlansByType = asyncHandler(async (req, res, next) => {
    const { planType, serverLocation } = req.query;

    if (!planType) {
        return next(new ErrorResponse('planType query parameter is required', 400));
    }

    let plans;
    try {
        plans = await DomainHostingPlansUseCase.getActivePlans(planType);
    } catch (err) {
        return next(new ErrorResponse('Failed to fetch plans', 500));
    }

    if (!plans || plans.length === 0) {
        return res.status(200).json({ status: true, data: [], message: 'No active plans found', responseCode: '000' });
    }

    // For backup, filter to the location-specific product
    if (planType === 'backup' && serverLocation) {
        const targetProductId = serverLocation === 'us' ? 'acronisbackupus' : 'acronisbackupasia';
        plans = plans.filter(p => p.productId === targetProductId);
        if (plans.length === 0) {
            return res.status(200).json({ status: true, data: [], message: 'No backup plan found for this location', responseCode: '000' });
        }
    }

    // Fetch pricing (auto-fetches from vendor on cache miss) and vendor credentials for plan-details calls
    let vendorBaseUrl = null;
    let vendorAuthParams = null;
    let pricingData = null;

    try {
        pricingData = await getPricingData(req?.LogTraceId);

        const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
        if (serviceOperator && !serviceOperator.error) {
            vendorBaseUrl = serviceOperator.vendor.apiUrl;
            vendorAuthParams = {
                'auth-userid': serviceOperator.vendor.optional1,
                'api-key': serviceOperator.vendor.optional2,
            };
        }
    } catch (err) {
        customLog(req?.LogTraceId, 'info', { action: 'getHostingPlansByType:fetchPricing', error: err?.message });
    }

    // Fetch plan details from vendor — one API call per unique productId, then extract per planId
    const planDetailsMap = {};
    if (vendorBaseUrl && planType !== 'domain') {
        const productIds = [...new Set(plans.map(p => p.productId).filter(Boolean))];
        await Promise.all(productIds.map(async productId => {
            const details = await fetchVendorPlanDetails(vendorBaseUrl, vendorAuthParams, planType, productId, req?.LogTraceId);
            if (details && details[productId]) {
                // Response structure: { [productId]: { [planId]: { plan_name, features, ... } } }
                Object.entries(details[productId]).forEach(([planId, planDetail]) => {
                    planDetailsMap[planId] = planDetail;
                });
            }
        }));
    }

    const planList = plans.reduce((acc, plan) => {
        let price = null;
        let pricingDetails = null;
        let addons = null;
        if (pricingData && plan.productId) {
            try {
                // For vps_server, pass null so resolveDomainHostingPrice returns the minimum price across all cycles
                const billingCycleForPrice = plan.planType === 'vps_server' ? null : plan.billingCycle;
                price = resolveDomainHostingPrice(pricingData, plan.productId, plan.planType, plan.planId, billingCycleForPrice);
                pricingDetails = resolvePlanPricingDetails(pricingData, plan.productId, plan.planId);
                addons = pricingData?.[plan.productId]?.addons || null;
            } catch { /* skip pricing on error */ }
        }
        if (price === null) return acc;
        acc.push({
            id: plan.id,
            planName: plan.planName,
            productId: plan.productId,
            planId: plan.planId,
            description: plan.description || null,
            features: plan.features ? (() => { try { return JSON.parse(plan.features); } catch { return plan.features; } })() : [],
            price,
            pricingDetails,
            addons,
            vendorDetails: planDetailsMap[plan.planId] || null,
        });
        return acc;
    }, []);

    return res.status(200).json({
        status: true,
        data: {
            planType,
            label: PLAN_TYPE_LABELS[planType] || planType,
            plans: planList,
        },
        message: 'Plans fetched successfully',
        responseCode: '000',
    });
});

// ─── Vendor lookup helpers ───────────────────────────────────────────────────

const fetchCustomerDefaultNS = async (baseUrl, authParams, customerId, logTraceId) => {
    try {
        const params = { ...authParams, 'customer-id': customerId };
        const response = await axios.get(`${baseUrl}/api/domains/customer-default-ns.json?${buildQuery(params)}`);
        const ns = response.data;
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultNS:result', ns, baseUrl });
        if (Array.isArray(ns) && ns.length >= 2) return ns;
        customLog(logTraceId, 'error', { action: 'fetchCustomerDefaultNS:insufficient', message: 'Default NS from vendor is empty or < 2', ns });
        return null;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'fetchCustomerDefaultNS:error', error: err?.response?.data || err.message });
        return null;
    }
};

// Fetches the first registered contact for a customer from ResellerClub contacts API.
// Contacts are separate entities from customers — the contact entityid is what
// reg-contact-id / admin-contact-id etc. expect in the domain register API.
const fetchCustomerDefaultContact = async (baseUrl, authParams, customerId, logTraceId) => {
    try {
        const params = {
            ...authParams,
            'customer-id': customerId,
            'no-of-records': 1,
            'page-no': 1,
        };
        const response = await axios.get(`${baseUrl}/api/contacts/search.json?${buildQuery(params)}`);
        const data = response.data;
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultContact', customerId, data });

        // Response is an object where numeric string keys hold contact records
        // e.g. { "recsindb": "3", "1": { "entityid": "...", "name": "...", ... } }
        const recordKey = Object.keys(data).find(k => !isNaN(k));
        const contactId = recordKey ? String(data[recordKey]?.entityid) : null;

        if (!contactId || contactId === 'null' || contactId === 'undefined') {
            customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultContact', message: 'No contacts found for customer', customerId });
            return null;
        }

        return contactId;
    } catch (err) {
        customLog(logTraceId, 'info', { action: 'fetchCustomerDefaultContact', error: err?.response?.data || err.message });
        return null;
    }
};

// Creates a ResellerClub contact for a customer using their own account details.
// Called when no contact exists for the customer and one is needed for domain registration.
// Returns the new contact's entityid string, or null on failure.
const createContactForCustomer = async (baseUrl, authParams, customerId, logTraceId) => {
    try {
        // Step 1: fetch customer details
        const detailsParams = { ...authParams, 'customer-id': customerId };
        const detailsUrl = `${baseUrl}/api/customers/details-by-id.json?${buildQuery(detailsParams)}`;
        customLog(logTraceId, 'error', { action: 'createContactForCustomer:fetchDetails:start', customerId, detailsUrl: detailsUrl.replace(authParams['api-key'], '***') });
        const detailsResponse = await axios.get(detailsUrl);
        const customer = detailsResponse.data;
        customLog(logTraceId, 'error', { action: 'createContactForCustomer:fetchDetails:result', customerId, customer });

        if (!customer || customer.status === 'ERROR') {
            customLog(logTraceId, 'error', { action: 'createContactForCustomer:fetchDetails:failed', message: 'Customer details returned error or empty', customerId, customer });
            return null;
        }

        // Step 2: create a contact using customer details
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
            customLog(logTraceId, 'error', { action: 'createContactForCustomer:missingFields', missingFields, customerId, contactParams });
            return null;
        }

        const addResponse = await axios.post(`${baseUrl}/api/contacts/add.json?${buildQuery(contactParams)}`);
        const contactId = String(addResponse.data);
        customLog(logTraceId, 'error', { action: 'createContactForCustomer:addResponse', customerId, contactId, raw: addResponse.data });

        if (!contactId || contactId === 'null' || contactId === 'undefined' || isNaN(Number(contactId))) {
            customLog(logTraceId, 'error', { action: 'createContactForCustomer:invalidResponse', customerId, response: addResponse.data });
            return null;
        }

        return contactId;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'createContactForCustomer:error', error: err?.response?.data || err.message, status: err?.response?.status });
        return null;
    }
};

// Basic domain name format check — must have at least one dot and a valid TLD
const DOMAIN_NAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const validateDomainAvailability = async (baseUrl, authParams, domainName, logTraceId) => {
    const domainParts = domainName.split('.');
    const name = domainParts[0];
    const tld = domainParts.slice(1).join('.');
    const params = { ...authParams, 'domain-name': name, tlds: tld };
    try {
        const response = await axios.get(`${baseUrl}/api/domains/available.json?${buildQuery(params)}`);
        const result = response.data?.[domainName] || response.data?.[domainName.toLowerCase()];
        const isAvailable = result?.status === 'available' || typeof result === 'number';
        customLog(logTraceId, 'info', { action: 'validateDomainAvailability', domainName, isAvailable, result });
        return isAvailable;
    } catch (err) {
        customLog(logTraceId, 'info', { action: 'validateDomainAvailability', domainName, error: err?.response?.data || err.message });
        return null; // null = couldn't determine, allow provisioning to proceed
    }
};

// ─── Vendor provisioning helpers ────────────────────────────────────────────

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

    // TLD-specific attributes (attr-name1/attr-value1, attr-name2/attr-value2, ...)
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
    customLog(logTraceId, 'info', { action: 'provision:titan_email:request', url: config.url, params: params}, 'VENDOR');
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
    customLog(logTraceId, 'info', { action: 'provision:google_workspace:request', url: config.url.replace(authParams['api-key'], '***'), 'domain-name': params['domain-name'], 'customer-id': params['customer-id'], 'plan-id': params['plan-id'] || null, 'no-of-accounts': params['no-of-accounts'], months: params.months }, 'VENDOR');
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

const provisionBackup = async (baseUrl, authParams, item, logTraceId) => {
    const productIdLower = String(item.productId || '').toLowerCase();
    const location = productIdLower.includes('us') ? 'us' : 'asia';
    const storageSizeGb = parseInt(item.storageSizeGb);
    if (!storageSizeGb || storageSizeGb < 1) {
        const err = new Error('Acronis Backup storage size is missing or invalid');
        err.vendorResponse = null;
        throw err;
    }
    const params = {
        ...authParams,
        'storage-size-gb': storageSizeGb,
        'customer-id': parseInt(item.customerId),
        'hosting-order-id': parseInt(item.hostingOrderId),
        months: parseInt(item.vpsMonths),
        'plan-id': parseInt(item.planId),
        'invoice-option': item.invoiceOption || 'NoInvoice',
        'discount-amount': item.discountAmount ?? 0.00,
    };
    const config = { method: 'POST', url: `${baseUrl}/api/backup/${location}/add.json?${buildQuery(params)}` };
    customLog(logTraceId, 'info', { action: 'provision:backup:request', url: config.url.replace(authParams['api-key'], '***'), location, 'plan-id': params['plan-id'], 'storage-size-gb': params['storage-size-gb'], 'hosting-order-id': params['hosting-order-id'] }, 'VENDOR');
    const response = await axios(config);
    const result = response.data;
    customLog(logTraceId, 'info', { action: 'provision:backup:response', httpStatus: response.status, result }, 'VENDOR');
    if (result?.status === 'error' || result?.status === 'ERROR') {
        const err = new Error(result.error || result.message || 'Acronis Backup provisioning failed');
        err.vendorResponse = result;
        throw err;
    }
    return result;
};

const provisionItem = async (baseUrl, authParams, item, logTraceId) => {
    customLog(logTraceId, 'info', { action: `provision:${item.itemType}`, domainName: item.domainName }, 'VENDOR');
    switch (item.itemType) {
        case 'domain':           return provisionDomain(baseUrl, authParams, item, logTraceId);
        case 'shared_hosting':   return provisionHosting(baseUrl, authParams, item, logTraceId);
        case 'vps_server':       return provisionVpsServer(baseUrl, authParams, item, logTraceId);
        case 'titan_email':      return provisionTitanEmail(baseUrl, authParams, item, logTraceId);
        case 'google_workspace': return provisionGoogleWorkspace(baseUrl, authParams, item, logTraceId);
        case 'backup':           return provisionBackup(baseUrl, authParams, item, logTraceId);
        default: throw new Error(`Unknown itemType: ${item.itemType}`);
    }
};

// ─── Payment controller ────────────────────────────────────────────────��─────
// Request body:
//   accessKey     {string}  Service access key (required)
//   amount        {number}  Total order amount — must match cart total (required)
//   account       {string}  Account identifier shown in transaction records
//   customerId    {string}  ResellerClub customer ID (required)
//   email         {string}  Receipt email address
//   payCashback   {boolean}
//   invoiceOption {string}  Default: 'NoInvoice' | 'PayInvoice' | 'KeepInvoice'
//   autoRenew     {boolean} Default: false
//   domainDetails {object}  Optional. Keyed by domain name, each entry:
//                           {
//                             ns?: string[],             // min 2, max 13; auto-fetched if omitted
//                             regContactId?: string,     // auto-fetched from customer details if omitted
//                             adminContactId?: string,   // defaults to regContactId
//                             techContactId?: string,    // defaults to regContactId
//                             billingContactId?: string, // defaults to regContactId
//                             years?: number,            // 1–10, default 1
//                             purchasePrivacyProtection?: boolean,
//                             discountAmount?: number,   // default 0.0
//                             attrs?: object             // TLD-specific: { cedcontactid, idnLanguageCode, premium, ... }
//                           }

exports.payment = asyncHandler(async (req, res, next) => {
    const {
        amount: bodyAmount,
        customerId,
        cartId,
        email,
        payCashback,
        invoiceOption = 'NoInvoice',
        autoRenew = false,
        domainDetails = {},
    } = req.body;

    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const name = req.user.name;
    const emailId = req.user.email;

    // ── 1. Fetch cart (amount + cart already validated by middleware) ─────────
    const userData = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
        ? { subCorporateUserId: req.user.subCorporateId }
        : { corporateUserId: req.user.corporateId };

    const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);

    // ── 2. Verify cartId matches the user's active cart ───────────────────────
    if (cart.cartId !== cartId) {
        return next(new ErrorResponse('Cart not found or has changed. Please refresh your cart and try again.', 400));
    }

    const cartItems = cart.productsArray;

    // ── 2.5 Validate domain name format for domain items ─────────────────────
    // Cart stores: productId = classkey (e.g. "domcno"), productName = domain (e.g. "marthandawarma.com")
    for (const item of cartItems) {
        if (item.itemType === 'domain') {
            if (!item.productName || !DOMAIN_NAME_RE.test(item.productName)) {
                customLog(req?.LogTraceId, 'error', { action: 'payment:domainValidation', productName: item.productName, productId: item.productId, message: 'Invalid or missing domain name in cart item productName' });
                return next(new ErrorResponse(
                    `Invalid domain name in cart. Please remove it and search for a valid domain (e.g. example.com).`,
                    400
                ));
            }
        }
    }

    // ── 3. Prefetch DB plan metadata for non-domain items ───────────────────
    // For non-domain items, cart stores productId (vendor classkey) + planId.
    // Look up the DB plan by vendor key to get billing metadata.
    const planCache = {};
    for (const item of cartItems) {
        if (item.itemType !== 'domain') {
            const cacheKey = `${item.productId}_${item.planId || ''}`;
            if (!planCache[cacheKey]) {
                const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId: item.productId, planId: item.planId });
                if (!plan) {
                    customLog(req?.LogTraceId, 'error', { action: 'payment:prefetchPlans', error: 'Plan not found', productId: item.productId, planId: item.planId });
                    return next(new ErrorResponse(
                        `One or more items in your cart are no longer available. Please refresh your cart and try again.`,
                        400
                    ));
                }
                planCache[cacheKey] = plan;
            }
        }
    }

    // ── 4. Amount — pre-validated by middleware (matches cart total) ──────────
    const amount = Number(bodyAmount).toFixed(2);
    const accountNo = cartItems.find(i => i.itemType === 'domain')?.productName
        || cartItems[0]?.productName
        || credentialId;

    // ── 5. Partner details + service details ─────────────────────────────────
    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const serviceDetails = await fetchServiceDetails({ credentialId, accessKey, packageId, corporateUserId });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        customLog(req?.LogTraceId, 'error', { action: 'payment:fetchServiceDetails', error: serviceDetails['error'], credentialId, packageId, corporateUserId });
        return next(new ErrorResponse('Unable to process your request. Please try again later.', 400));
    }

    const { commissionType, cashbackType, providerCommission, cashback: corporateCashback, id: serviceOperatorId } = serviceDetails;
    const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId);
    const surcharge = await calculateAmountWithTax(surchargeWithoutTax);
    const planDetails = await buildDomainHostingPlanDetails(cartItems, serviceDetails);
    const reportData = await computeJournalData({
        serviceDetails,
        amount: Number(amount),
        paymentMethod: 'WALLET',
        partnerDetails,
        paymentGatewayName: 'WALLET',
        couponTotalDiscount: req.body.couponTotalDiscount,
        planDetails,
        corporateState: req.user.state || '',
        credentialId,
    });

    // Vendor credentials — available from here onwards
    const vendorBaseUrl = serviceDetails.vendor.apiUrl;
    const vendorAuthParams = {
        'auth-userid': serviceDetails.vendor.optional1,
        'api-key': serviceDetails.vendor.optional2,
    };

    // ── 5.5. Pre-flight checks + fetch vendor defaults for domain items ─────────
    const hasDomainItems = cartItems.some(i => i.itemType === 'domain');
    let defaultNS = null;
    let fallbackContactId = null;

    if (hasDomainItems) {
        // Re-validate domain availability before charging — domain may have been taken since cart was loaded
        for (const item of cartItems) {
            if (item.itemType === 'domain') {
                const isAvailable = await validateDomainAvailability(vendorBaseUrl, vendorAuthParams, item.productName, req?.LogTraceId);
                if (isAvailable === false) {
                    return next(new ErrorResponse(
                        `"${item.productName}" is no longer available. Please remove it from your cart and search again.`,
                        400
                    ));
                }
                // null = availability check failed — log already done, allow provisioning to proceed
            }
        }

        // domainDetails is keyed by domain name (productName), e.g. { "marthandawarma.com": { ns, regContactId, ... } }
        const needsNS = cartItems.some(i => i.itemType === 'domain' && !domainDetails[i.productName]?.ns);
        const needsContact = cartItems.some(i => i.itemType === 'domain' && !domainDetails[i.productName]?.regContactId);

        if (needsNS) {
            defaultNS = await fetchCustomerDefaultNS(vendorBaseUrl, vendorAuthParams, customerId, req?.LogTraceId);
            if (!defaultNS) {
                customLog(req?.LogTraceId, 'error', { action: 'payment:defaultNS', message: 'Could not fetch default nameservers from vendor — reseller must configure default NS in panel' });
                return next(new ErrorResponse('Default nameservers are not configured. Please provide nameservers in domainDetails or configure default nameservers in your reseller panel.', 400));
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
                    customLog(req?.LogTraceId, 'info', { action: 'payment:customerContact', message: 'No contact found — auto-creating from customer details', customerId });
                    fallbackContactId = await createContactForCustomer(vendorBaseUrl, vendorAuthParams, customerId, req?.LogTraceId);
                }
                if (fallbackContactId) {
                    // Cache the resolved contact ID so future purchases skip vendor lookup
                    await updateCorporateDetails({ id: credentialId }, { domainHostingMeta: { ...existingMeta, contactId: fallbackContactId } });
                    customLog(req?.LogTraceId, 'info', { action: 'payment:customerContact', message: 'Contact ID cached', credentialId, fallbackContactId });
                }
            } else {
                customLog(req?.LogTraceId, 'info', { action: 'payment:customerContact', message: 'Using cached contact ID', credentialId, fallbackContactId });
            }

            if (!fallbackContactId) {
                customLog(req?.LogTraceId, 'error', { action: 'payment:customerContact', message: 'Failed to resolve or create contact for customer', customerId });
                return next(new ErrorResponse('Could not resolve contact details for domain registration. Please provide regContactId in domainDetails.', 400));
            }
        }
    }

    // ── 5.6. Validate backup cart items before charging ───────────────────────
    for (const item of cartItems) {
        if (item.itemType === 'backup') {
            const gb = parseInt(item.storageInGb);
            if (!gb || gb < 1) {
                return next(new ErrorResponse('Acronis Backup storage size is missing or invalid. Please remove and re-add the backup item.', 400));
            }
            const vpsItem = cartItems.find(i => i.itemType === 'vps_server' && i.productId === item.vpsProductId);
            if (!vpsItem) {
                return next(new ErrorResponse('Acronis Backup is not linked to a valid VPS Server in your cart. Please remove and re-add the backup item.', 400));
            }
        }
    }

    // ── 6. Process payment (wallet / PG / RazorPay / Paytm) ─────────────────
    const transactionId = new Date().valueOf();
    let providerId = transactionId;
    let corporateTxnId = new Date().valueOf();
    let transactionResponse = {};
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
        providerId,
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

    if (Object.prototype.hasOwnProperty.call(req.body, 'razorPay')) {
        transactionResponse = await createRazorPayTransaction({ ...commonParams, razorPayAmount: req.body.razorPayAmount, razorPayResponse: req.body.razorPay });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        transactionResponse = await createPGTransaction({ ...commonParams, pgAmount: req.body.pgAmount, pgResponse: req.body.paymentGatewayResponse });
    } else if (Object.prototype.hasOwnProperty.call(req.body, 'paytmResponse')) {
        transactionResponse = await createPaytmTransaction({ ...commonParams, paytmAmount: req.body.paytmAmount, paytmResponse: req.body.paytmResponse });
    } else {
        transactionResponse = await createWalletTransaction({ ...commonParams, amount });
    }

    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
        customLog(req?.LogTraceId, 'error', { action: 'payment:createTransaction', error: transactionResponse['error'], corporateTxnId, amount, credentialId });
        return next(new ErrorResponse('Payment could not be processed. Please try again later.', 500));
    }

    publishJournal('payment');

    // Store cartItems immediately so PENDING orders (server crash before provisioning) still show product details
    await updateOrder({ corporateTxnId: String(corporateTxnId) }, {
        orderResponse: JSON.stringify({ cartItems }),
    });

    // ── 7. Validate all non-domain items (except backup) have a domainName set ─
    const missingDomain = cartItems.find(i => i.itemType !== 'domain' && i.itemType !== 'backup' && !i.domainName);
    if (missingDomain) {
        return next(new ErrorResponse(
            `Domain name is required for ${missingDomain.itemType} (${missingDomain.productId}). Please update your cart before checkout.`,
            400
        ));
    }

    // ── 8. Build vendor items from cart ──────────────────────────────────────
    const vendorItemsUnsorted = cartItems.map(item => {
        if (item.itemType === 'domain') {
            // productId = classkey (e.g. "domcno"), productName = actual domain (e.g. "marthandawarma.com")
            const d = domainDetails[item.productName] || {};
            const resolvedContactId = d.regContactId || fallbackContactId;
            return {
                itemType: 'domain',
                domainName: item.productName,        // actual domain name from cart
                customerId,
                years: item.billingCycle || d.years || 1,
                ns: d.ns || defaultNS,               // use vendor default NS when not supplied
                regContactId: resolvedContactId,
                adminContactId: d.adminContactId || resolvedContactId,
                techContactId: d.techContactId || resolvedContactId,
                billingContactId: d.billingContactId || resolvedContactId,
                purchasePrivacy: d.purchasePrivacyProtection ?? false,
                discountAmount: d.discountAmount ?? 0.0,
                attrs: d.attrs || {},                // TLD-specific attr-name/attr-value pairs e.g. { cedcontactid: 'xxx', idnLanguageCode: 'hindi' }
                invoiceOption,
                autoRenew,
            };
        }

        if (item.itemType === 'backup') {
            const plan = planCache[`${item.productId}_${item.planId || ''}`];
            return {
                itemType: 'backup',
                customerId,
                productId: plan.productId,           // 'acronisbackupasia' or 'acronisbackupus'
                planId: plan.planId,
                months: item.billingCycle || 1,
                storageSizeGb: item.storageInGb,
                vpsProductId: item.vpsProductId,     // used to look up VPS order ID after provisioning
                invoiceOption,
            };
        }

        const plan = planCache[`${item.productId}_${item.planId || ''}`];
        return {
            itemType: item.itemType,
            domainName: item.domainName,             // set via update-details after adding to cart
            customerId,
            productId: plan.productId,               // vendor classkey (for hosting OS detection)
            planId: plan.planId,                     // vendor plan number
            months: item.billingCycle || plan.billingCycle || 1,
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

    // Ensure VPS servers are always provisioned before their linked backup items
    const PROVISION_ORDER = { domain: 0, shared_hosting: 1, vps_server: 2, titan_email: 3, google_workspace: 4, backup: 5 };
    const vendorItems = [...vendorItemsUnsorted].sort(
        (a, b) => (PROVISION_ORDER[a.itemType] ?? 99) - (PROVISION_ORDER[b.itemType] ?? 99)
    );

    // ── 8. Provision each item via vendor API ────────────────────────────────
    const baseUrl = vendorBaseUrl;
    const authParams = vendorAuthParams;

    const provisionResults = [];
    let provisionFailed = false;
    let failedItem = null;
    let backupProvisionFailed = false;
    // Track VPS provision results keyed by productId so backup can look up the hosting order ID and months
    const vpsOrderIds = {};
    const vpsMonthsMap = {};

    for (const item of vendorItems) {
        try {
            // For backup, inject the hosting order ID and months from the already-provisioned VPS
            const enrichedItem = item.itemType === 'backup'
                ? { ...item, hostingOrderId: vpsOrderIds[item.vpsProductId], vpsMonths: vpsMonthsMap[item.vpsProductId] }
                : item;

            if (item.itemType === 'backup' && !enrichedItem.hostingOrderId) {
                throw new Error(`Cannot provision Acronis Backup: VPS order ID not found for ${item.vpsProductId}`);
            }

            const result = await provisionItem(baseUrl, authParams, enrichedItem, req?.LogTraceId);
            customLog(req?.LogTraceId, 'info', { action: `provision:${item.itemType}:success`, result }, 'VENDOR');
            provisionResults.push({ itemType: item.itemType, domainName: item.domainName ?? null, status: 'SUCCESS', result });

            if (item.itemType === 'vps_server') {
                const orderId = result?.entityid || result?.orderId || result?.orderid;
                if (orderId) vpsOrderIds[item.productId] = orderId;
                vpsMonthsMap[item.productId] = item.months;
            }
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
            provisionResults.push({ itemType: item.itemType, domainName: item.domainName ?? null, status: 'FAILURE' });

            if (item.itemType === 'backup') {
                // Backup failure is non-fatal — VPS is already provisioned and paid for.
                // Log, notify admin, and continue so the order still succeeds.
                backupProvisionFailed = true;
                failedItem = item;
            } else {
                provisionFailed = true;
                failedItem = item;
                break;
            }
        }
    }

    // ── 9. Update transaction + refund if provisioning failed ────────────────
    let updateDetails = {};

    if (provisionFailed) {
        updateDetails = {
            corporateTxnId,
            status: 'FAILURE',
            providerId: 'Not Available',
            message: `Provisioning failed for ${failedItem?.itemType} — ${failedItem?.domainName}`,
            registeredById: req.user.registeredBy,
            orderResponse: JSON.stringify({ cartItems, provisionResults }),
        };

        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            const refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
            if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
                await refundWalletTransaction(updateDetails);
                publishJournal('refund');
            }
        } else {
            await refundWalletTransaction(updateDetails);
            publishJournal('refund');
        }
    } else {
        updateDetails = {
            corporateTxnId,
            providerId: provisionResults.map(r => r.result?.entityid || r.result?.orderId || 'N/A').join(', '),
            status: 'SUCCESS',
            message: 'Payment Successful',
            orderResponse: JSON.stringify({ cartItems, provisionResults, email }),
        };

        // Clear cart only on full success
        await ServiceCartUseCase.clearCart(userData);

        if (backupProvisionFailed) {
            customLog(req?.LogTraceId, 'info', {
                action: 'payment:backupProvisionFailed',
                message: 'Acronis Backup provisioning failed after successful VPS provision — manual provisioning required',
                corporateTxnId,
            });
            createNotification({
                notificationTitle: 'Acronis Backup Provisioning Failed',
                notificationBrief: `VPS provisioned successfully (Txn: ${corporateTxnId}) but Acronis Backup failed. Manual provisioning required.`,
                notificationTo: [req.user.username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
            });
        }
    }

    await updateWalletTransaction(updateDetails);

    const totalAmount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2);

    // ── 10. Email + notification ─────────────────────────────────────────────
    if (updateDetails.message === 'Payment Successful') {
        const invoiceAttachments = await generateOrderInvoiceAttachments({
            amount: parseFloat(amount) || 0,
            surcharge: surcharge || 0,
            couponDiscount: 0,
            corporateTxnId,
            orderId: transactionResponse?.orderId ?? (await findOneOrder({ corporateTxnId }))?.id,
            paymentType: "Domain & Hosting",
            credentialId,
            vendor: serviceDetails?.vendor,
            commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
            planDetails,
            commissionMode: reportData?.journalData?.commissionMode || 'MARGIN',
            traceId: req?.LogTraceId,
        });

        const { subject, html, sender } = await resolveDomainHostingSuccessEmail(
            name, corporateTxnId, totalAmount, provisionResults, partnerDetails,
            { partnerId: req.user.registeredBy || null, logTraceId: req?.LogTraceId }
        );

        emailer.emailWithMultipleAttachment(email || emailId, subject, html, invoiceAttachments, (emailErr) => {
            if (emailErr) customLog(req?.LogTraceId, 'error', { message: 'Error sending email', emailErr });
            else customLog(req?.LogTraceId, 'info', { message: `Email sent to ${email || emailId}` });
        }, sender);

        createNotification({
            notificationTitle: 'Domain & Hosting - Payment successful',
            notificationBrief: `Payment of ₹${totalAmount} was successful. Transaction ID: ${corporateTxnId}.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            return res.redirect(`${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`);
        }
        return res.status(200).json({
            status: true,
            data: { ...transactionResponse, corporateTxnId, provisionResults },
            message: 'Payment successful',
            responseCode: '000',
        });
    } else {
        const serviceUrl = partnerDetails?.baseUrl;

        const { subject, html, sender } = await resolvePaymentFailedEmail({
            key: EMAIL_TEMPLATE_KEYS.DOMAIN_HOSTING_PAYMENT_FAILED,
            service: EMAIL_TEMPLATE_SERVICES.DOMAIN_HOSTING,
            name,
            serviceName: 'Domain & Hosting',
            url: serviceUrl,
            partnerDetails,
            partnerId: req.user.registeredBy || null,
            logTraceId: req?.LogTraceId,
        });
        emailer.email(emailId, subject, html, () => {
            customLog(req?.LogTraceId, 'info', { message: `Failure email sent to ${emailId}` });
        }, sender);

        createNotification({
            notificationTitle: 'Domain & Hosting - Payment unsuccessful',
            notificationBrief: `Payment of ₹${totalAmount} was unsuccessful. Transaction ID: ${corporateTxnId}.`,
            notificationTo: [req.user.username],
            notificationCategory: 'CORPORATE',
            notificationBy: 'ADMIN',
        });

        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
            return res.redirect(`${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`);
        }

        const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] });
        return res.status(500).json({
            status: false,
            message: 'Something went wrong',
            data: { corporateFinalBalance: walletDetails?.['balance'] },
            responseCode: '001',
        });
    }
});

// ─── Order History ────────────────────────────────────────────────────────────

exports.getOrderHistory = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    let { page, itemsPerPage, searchText = '', from, to } = req.query;

    page = parseInt(page) || 1;
    itemsPerPage = parseInt(itemsPerPage) || 10;
    const limit = itemsPerPage;
    const offset = (page - 1) * itemsPerPage;

    const defaultFrom = from || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
    const defaultTo = to || new Date().toISOString().split('T')[0];

    const result = await findDomainHostingOrders({
        credentialId,
        searchText,
        from: defaultFrom,
        to: defaultTo,
        limit,
        offset,
    });

    if (!result) {
        return next(new ErrorResponse('Failed to fetch order history', 500));
    }

    const orders = result.rows.map(o => {
        let parsedResponse = null;
        try { parsedResponse = o.orderResponse ? JSON.parse(o.orderResponse) : null; } catch { /* skip */ }
        const cartItems = parsedResponse?.cartItems || [];
        const provisionResults = (parsedResponse?.provisionResults || []).map(pr => {
            const cartItem = cartItems.find(
                ci => ci.domainName === pr.domainName && ci.itemType === pr.itemType
            );
            return {
                ...pr,
                ...(cartItem?.os ? { os: cartItem.os } : {}),
                ...(Array.isArray(cartItem?.addons) && cartItem.addons.length > 0 ? { addons: cartItem.addons } : {}),
            };
        });
        return {
            id: o.id,
            corporateTxnId: o.corporateTxnId,
            transactionDate: o.transactionDate,
            amount: parseFloat(o.amountInINR || 0),
            surcharge: parseFloat(o.surcharge || 0),
            totalAmount: parseFloat((parseFloat(o.amountInINR || 0) + parseFloat(o.surcharge || 0)).toFixed(2)),
            status: o.status,
            paymentMode: o.paymentMode,
            providerId: o.providerId,
            items: cartItems,
            provisionResults,
        };
    });

    return res.status(200).json({
        status: true,
        message: 'Order history fetched successfully',
        responseCode: '000',
        data: {
            orders,
            totalRecords: result.count,
            page,
            itemsPerPage,
        },
    });
});

exports.downloadOrderInvoice = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const { corporateTxnId } = req.params;

    if (!corporateTxnId) {
        return next(new ErrorResponse('corporateTxnId is required', 400));
    }

    const orderRecord = await findDomainHostingOrderByTxnId({ credentialId, corporateTxnId });
    if (!orderRecord) {
        return next(new ErrorResponse('Order not found', 404));
    }

    const receiptPdf = null;

    return res.status(200).json({
        status: true,
        message: 'Invoice generated successfully',
        responseCode: '000',
        data: {
            filename: receiptPdf.filename,
            pdfBuffer: receiptPdf.content,
        },
    });
});

// ─── Delete / Cancel Plan ─────────────────────────────────────────────────────

const DELETE_RESOLVERS = {
    vps_server: (baseUrl, authParams, orderId, productId) => {
        const location = String(productId || '').toLowerCase().includes('us') ? 'us' : 'in';
        const url = `${baseUrl}/api/virtualserver/linux/${location}/delete.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId) });
        return { url, query };
    },

    shared_hosting: (baseUrl, authParams, orderId, productId) => {
        const { apiType, os, location } = resolveHostingEndpoint(productId);
        const url = `${baseUrl}/api/${apiType}/${os}/${location}/delete.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId) });
        return { url, query };
    },

    titan_email: (baseUrl, authParams, orderId) => {
        const url = `${baseUrl}/restapi/product/titanmailindia/order/${parseInt(orderId)}`;
        const query = buildQuery(authParams);
        return { url, query, method: 'DELETE' };
    },

    google_workspace: (baseUrl, authParams, orderId) => {
        const url = `${baseUrl}/api/gapps/in/delete.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId) });
        return { url, query };
    },

    domain: (baseUrl, authParams, orderId) => {
        const url = `${baseUrl}/api/domains/delete.json`;
        const query = buildQuery({ ...authParams, 'order-id': parseInt(orderId) });
        return { url, query };
    },
};

const isMoneyBackGracePeriodRejection = (payload) => {
    const raw = typeof payload === 'string' ? payload : payload?.message || payload?.error || '';
    const message = String(raw).toLowerCase();
    return /grace[\s-]*period/.test(message) || /money[\s-]*grace/.test(message);
};

// A cancellation's orderId is valid only if it was provisioned under the caller's own
// order — confirm it against that order's stored provisionResults.
const orderIdBelongsToOrder = (orderRow, orderId) => {
    const target = String(orderId);
    let resp;
    try {
        resp = typeof orderRow.orderResponse === 'string' ? JSON.parse(orderRow.orderResponse) : (orderRow.orderResponse || {});
    } catch (_) {
        return false;
    }
    const results = Array.isArray(resp?.provisionResults) ? resp.provisionResults : [];
    return results.some((r) => {
        const v = r?.result || {};
        return [v.entityid, v.orderId, v.orderid].some((x) => x != null && String(x) === target);
    });
};

exports.deletePlan = asyncHandler(async (req, res, next) => {
    const { orderId, itemType, productId, corporateTxnId } = req.body;
    const { id: credentialId, corporateId: corporateUserId, packageId } = req.user;

    if (!orderId || !itemType) {
        return next(new ErrorResponse('orderId and itemType are required', 400));
    }

    // Ownership gate (runs before any vendor call): the orderId must have been provisioned
    // under the caller's own order (credentialId + corporateTxnId). Otherwise a body orderId
    // would be deleted against Peko's master reseller credentials regardless of owner,
    // letting a tenant destroy another tenant's domain/VPS/email.
    if (!corporateTxnId) {
        return next(new ErrorResponse('corporateTxnId is required', 400));
    }
    const ownOrder = await findDomainHostingOrderByTxnId({ credentialId, corporateTxnId: String(corporateTxnId) });
    if (!ownOrder || !orderIdBelongsToOrder(ownOrder, orderId)) {
        return next(new ErrorResponse('Order not found', 404));
    }

    const resolver = DELETE_RESOLVERS[itemType];
    if (!resolver) {
        return next(new ErrorResponse(
            `Unsupported itemType: '${itemType}'. Supported: ${Object.keys(DELETE_RESOLVERS).filter(k => k !== 'shared_hosting').join(', ')}`,
            400
        ));
    }

    const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse(serviceDetails.error, 400));
    }

    const baseUrl = serviceDetails.vendor.apiUrl;
    const authParams = {
        'auth-userid': serviceDetails.vendor.optional1,
        'api-key': serviceDetails.vendor.optional2,
    };

    // ── Step 1: fetch order details from reseller to check current status ────────
    let vendorOrderDetail = null;
    const detailResolver = ORDER_DETAIL_RESOLVERS[itemType];
    if (detailResolver) {
        const { url: detailUrl, query: detailQuery, method: detailMethod = 'GET' } = detailResolver(baseUrl, authParams, orderId, productId);
        customLog(req?.LogTraceId, 'info', { action: 'deletePlan:fetchDetails:request', url: detailUrl, orderId, itemType }, 'VENDOR');

        try {
            const detailResponse = detailMethod === 'GET'
                ? await axios.get(`${detailUrl}?${detailQuery}`)
                : await axios.post(`${detailUrl}?${detailQuery}`);
            vendorOrderDetail = detailResponse.data;

            customLog(req?.LogTraceId, 'info', { action: 'deletePlan:fetchDetails:response', vendorOrderDetail }, 'VENDOR');

            // Reject if the vendor reports the order is already deleted/cancelled
            const currentStatus = (vendorOrderDetail?.currentstatus || vendorOrderDetail?.status || '').toLowerCase();
            if (['deleted', 'cancelled', 'suspended'].includes(currentStatus)) {
                // Sync our DB to reflect the vendor's current state so admin can see it
                if (corporateTxnId) {
                    try {
                        const existingOrder = await findDomainHostingOrderByTxnId({ credentialId, corporateTxnId });
                        if (existingOrder) {
                            const existingResponse = existingOrder.orderResponse
                                ? (typeof existingOrder.orderResponse === 'string' ? JSON.parse(existingOrder.orderResponse) : existingOrder.orderResponse)
                                : {};
                            await updateOrder({ id: existingOrder.id }, {
                                status: 'CANCELLATION_REQUESTED',
                                orderResponse: JSON.stringify({
                                    ...existingResponse,
                                    cancelledAt: new Date(),
                                    cancelledItemType: itemType,
                                    vendorOrderDetails: vendorOrderDetail,
                                }),
                            });
                        }
                    } catch (e) {
                        customLog(req?.LogTraceId, 'info', { action: 'deletePlan:syncCancelledStatus', error: e.message });
                    }
                }
                return next(new ErrorResponse(`Order is already ${currentStatus} and cannot be cancelled again.`, 400));
            }

            // Reject if vendor itself returned an error (order not found, etc.)
            if (vendorOrderDetail?.status === 'ERROR' || vendorOrderDetail?.status === 'error') {
                customLog(req?.LogTraceId, 'error', { action: 'deletePlan:fetchDetails:vendorError', vendorOrderDetail, orderId, itemType }, 'VENDOR');
                return next(new ErrorResponse('Unable to retrieve order details. Please try again later.', 400));
            }
        } catch (err) {
            const vendorError = err?.response?.data;
            customLog(req?.LogTraceId, 'error', { action: 'deletePlan:fetchDetails:error', httpStatus: err?.response?.status, vendorError, orderId, itemType }, 'VENDOR');
            return next(new ErrorResponse('Unable to retrieve order details. Please try again later.', 500));
        }
    }

    // ── Step 2: proceed with cancellation ────────────────────────────────────────
    const { url, query, method = 'POST' } = resolver(baseUrl, authParams, orderId, productId);

    customLog(req?.LogTraceId, 'info', { action: 'deletePlan:request', url, method, orderId, itemType }, 'VENDOR');

    let result;
    try {
        const response = method === 'DELETE'
            ? await axios.delete(`${url}?${query}`)
            : await axios.post(`${url}?${query}`);
        result = response.data;
    } catch (err) {
        const vendorError = err?.response?.data;
        customLog(req?.LogTraceId, 'error', { action: 'deletePlan:vendorError', httpStatus: err?.response?.status, vendorError, orderId, itemType }, 'VENDOR');
        if (itemType === 'domain' && isMoneyBackGracePeriodRejection(vendorError)) {
            return next(new ErrorResponse('Unable to process request as the Money-Back Grace Period has expired.', 400));
        }
        return next(new ErrorResponse('Unable to process the delete request. Please try again later.', 500));
    }

    customLog(req?.LogTraceId, 'info', { action: 'deletePlan:response', result }, 'VENDOR');

    const isFailed = result?.status === 'error' || result?.status === 'ERROR';

    if (isFailed) {
        customLog(req?.LogTraceId, 'error', { action: 'deletePlan:failed', error: result.error || result.message, orderId, itemType }, 'VENDOR');
        if (itemType === 'domain' && isMoneyBackGracePeriodRejection(result)) {
            return next(new ErrorResponse('Unable to process request as the Money-Back Grace Period has expired.', 400));
        }
        return next(new ErrorResponse('Unable to process the delete request. Please try again later.', 400));
    }

    // Mark order as CANCELLATION_REQUESTED so admin can process refund
    if (corporateTxnId) {
        try {
            const existingOrder = await findDomainHostingOrderByTxnId({ credentialId, corporateTxnId });
            if (existingOrder) {
                const existingResponse = existingOrder.orderResponse
                    ? (typeof existingOrder.orderResponse === 'string' ? JSON.parse(existingOrder.orderResponse) : existingOrder.orderResponse)
                    : {};
                await updateOrder({ id: existingOrder.id }, {
                    status: 'CANCELLATION_REQUESTED',
                    orderResponse: JSON.stringify({
                        ...existingResponse,
                        cancelledAt: new Date(),
                        cancelledItemType: itemType,
                        vendorOrderDetails: vendorOrderDetail,
                        vendorCancelResponse: result,
                    }),
                });
            }
        } catch (e) {
            customLog(req?.LogTraceId, 'info', { action: 'deletePlan:markCancellation', error: e.message });
        }
    }

    return res.status(200).json({
        status: true,
        message: `${itemType} plan deleted successfully`,
        responseCode: '000',
        data:{},
    });
});
