'use strict';
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const axios = require('axios');
const ServiceCartUseCase = require('../../models/use-cases/serviceCart');
const DomainHostingPlansUseCase = require('../../models/use-cases/domainHostingPlans');
const { resolveDomainHostingPrice, resolvePlanPricingDetails, getValidBillingCycles, getValidDomainYears } = require('../../utils/resolveDomainHostingPrice');
const { getPricingData } = require('../../utils/domainHostingPricingCache');
const { customLog } = require('../../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const { findOne: findCorporateUser } = require('../../models/use-cases/corporateUser');
const operatorsData = require('../../utils/operatorsData.json');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const accessKey = operatorsData["domainAndHosting"]["accessKey"];

// Fetches vendor plan-details for a backup product (12-hour cached)
const fetchBackupPlanVendorDetails = async (baseUrl, authParams, productId, planId) => {
    const cacheKey = `plan_details_backup_${productId}`;
    try {
        const cached = await getValue(cacheKey);
        if (cached) {
            const data = JSON.parse(cached);
            return data?.[productId]?.[planId] || null;
        }
        const queryStr = Object.entries({ ...authParams, 'product-key': productId })
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        const response = await axios.get(`${baseUrl}/api/products/plan-details.json?${queryStr}`);
        const data = response.data;
        if (data && data.status !== 'ERROR') {
            await setValue(cacheKey, 60 * 60 * 12, JSON.stringify(data));
        }
        return data?.[productId]?.[planId] || null;
    } catch {
        return null;
    }
};

const getUserData = (req) => {
    const userData = {};
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
        userData.subCorporateUserId = req.user.subCorporateId;
    } else {
        userData.corporateUserId = req.user.corporateId;
    }
    return userData;
};

// ─── Service-specific resolvers ───────────────────────────────────────────────
// To support a new top-level service, add a new key here with its own
// allowedItemTypes, getUnitPrice, resolveQty, and extraFields implementations.

const SERVICE_RESOLVERS = {
    domainAndHosting: {
        allowedItemTypes: ['domain', 'vps_server', 'shared_hosting', 'titan_email', 'google_workspace', 'backup'],

        async getUnitPrice(productId, itemType, billingCycle = null, planId = null) {
            const pricingData = await getPricingData();
            if (!pricingData) return null;

            if (itemType === 'domain') {
                return resolveDomainHostingPrice(pricingData, productId, 'domain', null, billingCycle || 1);
            }

            // Lookup plan by vendor productId + planId
            const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId, planId });
            if (!plan) return null;
            const cycle = billingCycle || plan.billingCycle;
            return resolveDomainHostingPrice(pricingData, plan.productId, plan.planType, plan.planId, cycle);
        },

        async validateBillingCycle(productId, planId, billingCycle, itemType) {
            const pricingData = await getPricingData();
            if (!pricingData) {
                customLog(null, 'error', { action: 'validateBillingCycle', message: 'pricingData is null', productId, planId, billingCycle });
                return { valid: false, validCycles: null, validYears: null };
            }

            if (itemType === 'domain') {
                const validYears = getValidDomainYears(pricingData, productId);
                const valid = validYears ? validYears.some(y => y.years === billingCycle) : false;
                return { valid, validCycles: null, validYears: validYears ? validYears.map(y => y.years) : null };
            }

            // Backup billing cycle matches the linked VPS — any value >= 1 is valid
            if (itemType === 'backup') {
                return { valid: parseInt(billingCycle) >= 1, validCycles: null, validYears: null };
            }

            const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId, planId });
            if (!plan) {
                customLog(null, 'error', { action: 'validateBillingCycle', message: 'plan not found in DB', productId, planId, billingCycle });
                return { valid: false, validCycles: null, validYears: null };
            }

            const pricingDetails = resolvePlanPricingDetails(pricingData, plan.productId, plan.planId);
            customLog(null, 'info', { action: 'validateBillingCycle', plan: { productId: plan.productId, planId: plan.planId, planType: plan.planType }, pricingDetails, billingCycle });

            if (!pricingDetails?.add) return { valid: false, validCycles: null, validYears: null };

            const validCycles = Object.keys(pricingDetails.add).map(Number);
            return { valid: validCycles.includes(billingCycle), validCycles, validYears: null };
        },

        resolveQty(itemType, productQuantity, body) {
            if (itemType === 'titan_email') return parseInt(body.accounts) || 1;
            if (itemType === 'google_workspace') return parseInt(body.seats) || 1;
            if (itemType === 'shared_hosting' || itemType === 'vps_server' || itemType === 'domain') return 1;
            if (itemType === 'backup') return 1;
            return parseInt(productQuantity) || 1;
        },

        extraFields(itemType, body) {
            const fields = {};
            if (itemType === 'domain') {
                fields.billingCycle = parseInt(body.billingCycle) || 1;
            }
            if (itemType === 'titan_email') {
                fields.accounts = parseInt(body.accounts) || 1;
                fields.billingCycle = parseInt(body.billingCycle) || 1;
                if (body.domainName) fields.domainName = body.domainName;
            }
            if (itemType === 'google_workspace') {
                fields.seats = parseInt(body.seats) || 1;
                fields.billingCycle = parseInt(body.billingCycle) || 1;
                if (body.domainName) fields.domainName = body.domainName;
            }
            if (itemType === 'vps_server' || itemType === 'shared_hosting') {
                if (body.billingCycle) fields.billingCycle = parseInt(body.billingCycle);
                if (body.domainName) fields.domainName = body.domainName;
            }
            if (itemType === 'backup') {
                fields.billingCycle = parseInt(body.billingCycle) || 1;
                fields.storageInGb = parseInt(body.storageInGb) || 0;
                if (body.vpsProductId) fields.vpsProductId = body.vpsProductId;
            }
            return fields;
        }
    }
};

const getResolver = (service, next) => {
    const resolver = SERVICE_RESOLVERS[service];
    if (!resolver) {
        next(new ErrorResponse(
            `Unsupported service: '${service}'. Supported: ${Object.keys(SERVICE_RESOLVERS).join(', ')}`,
            400
        ));
        return null;
    }
    return resolver;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Silently removes cart items whose plan no longer exists in the DB (deleted/deactivated).
// Returns the list of removed items.
const purgeInvalidCartItems = async (userData, productsArray) => {
    const removed = [];
    for (const item of productsArray) {
        if (item.itemType === 'domain') continue;
        const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId: item.productId, planId: item.planId });
        if (!plan) {
            await ServiceCartUseCase.deleteExistingProductInCart({ productId: item.productId, planId: item.planId }, userData);
            removed.push(item);
        }
    }
    return removed;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

exports.addProductToCart = asyncHandler(async (req, res, next) => {
    const {
        service = 'domainAndHosting',
        itemType,
        productId,
        planId = null,
        productName = null,
        productQuantity = 1,
        billingCycle,
        controlPanel,
        ...rest
    } = req.body;

    if (!itemType || !productId) {
        return next(new ErrorResponse('itemType and productId are required', 400));
    }
    if (itemType === 'domain' && !productName) {
        return next(new ErrorResponse('productName (domain name) is required for domain items', 400));
    }

    const resolver = getResolver(service, next);
    if (!resolver) return;

    if (!resolver.allowedItemTypes.includes(itemType)) {
        return next(new ErrorResponse(
            `Invalid itemType for ${service}. Allowed: ${resolver.allowedItemTypes.join(', ')}`,
            400
        ));
    }

    // ── Backup-specific validation ────────────────────────────────────────────
    if (itemType === 'backup') {
        const userData = getUserData(req);
        const gb = parseInt(req.body.storageInGb) || 0;
        const vpsProductId = req.body.vpsProductId;

        // Billing cycle must match the VPS item in cart
        const existingCart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
        const vpsItem = (existingCart && existingCart !== -1)
            ? existingCart.productsArray.find(i => i.itemType === 'vps_server')
            : null;
        if (!vpsItem) {
            return next(new ErrorResponse('A VPS Server item must be in your cart before adding Acronis Cyber Backup', 400));
        }
        req.body.billingCycle = vpsItem.billingCycle;

        let vendorDetails = null;
        try {
            const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
            if (serviceOperator && !serviceOperator.error) {
                vendorDetails = await fetchBackupPlanVendorDetails(
                    serviceOperator.vendor.apiUrl,
                    { 'auth-userid': serviceOperator.vendor.optional1, 'api-key': serviceOperator.vendor.optional2 },
                    productId,
                    planId
                );
            }
        } catch { /* non-fatal — proceed without vendor detail check */ }

        if (vendorDetails) {
            if (vendorDetails.plan_status !== 'Active') {
                return next(new ErrorResponse('Acronis Cyber Backup plan is not currently active', 400));
            }
            const minStorage = vendorDetails.minimumStorageSize ?? 1;
            const maxStorage = vendorDetails.maximumStorageSize ?? 5000;
            if (gb < minStorage || gb > maxStorage) {
                return next(new ErrorResponse(
                    `Backup storage must be between ${minStorage} GB and ${maxStorage} GB`,
                    400
                ));
            }
            if (vpsProductId) {
                const supportedKeys = (vendorDetails.miscellaneous?.supportedProductKeys ?? '')
                    .split(',').map(k => k.trim()).filter(Boolean);
                if (supportedKeys.length > 0 && !supportedKeys.includes(vpsProductId)) {
                    return next(new ErrorResponse(
                        'Acronis Cyber Backup is not compatible with the selected VPS plan',
                        400
                    ));
                }
            }
        }
    }

    let resolvedBillingCycle = billingCycle
        ? parseInt(billingCycle)
        : (itemType === 'titan_email' || itemType === 'google_workspace' || itemType === 'domain') ? 1 : null;

    // Some TLDs (e.g. .ai) enforce a multi-year minimum registration — year 1
    // has no price, so default to the lowest valid registration period instead.
    if (itemType === 'domain' && !billingCycle) {
        const pricingData = await getPricingData();
        const validYears = pricingData ? getValidDomainYears(pricingData, productId) : null;
        if (validYears?.length) {
            resolvedBillingCycle = validYears[0].years;
            req.body.billingCycle = resolvedBillingCycle;
        }
    }

    if (billingCycle) {
        const { valid, validCycles, validYears } = await resolver.validateBillingCycle(productId, planId, parseInt(billingCycle), itemType);
        if (!valid) {
            return next(new ErrorResponse(
                validYears
                    ? `Invalid registration period. Allowed values: ${validYears.join(', ')} year(s)`
                    : validCycles
                    ? `Invalid billingCycle. Allowed values for this plan: ${validCycles.join(', ')} month(s)`
                    : 'Invalid billingCycle. Pricing not available for this plan.',
                400
            ));
        }
    }

    let unitPrice = await resolver.getUnitPrice(productId, itemType, resolvedBillingCycle, planId);
    if (!unitPrice) {
        return next(new ErrorResponse(
            'Pricing not available. Please search for the service first so pricing is cached.',
            422
        ));
    }

    // For domain items: always call premium-check API to ensure domain is not a premium domain
    if (itemType === 'domain' && productName) {
        try {
            const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
            if (serviceOperator && !serviceOperator.error) {
                const baseUrl = serviceOperator.vendor.apiUrl;
                const premiumCheckUrl = `${baseUrl}/api/domains/premium-check.json?auth-userid=${encodeURIComponent(serviceOperator.vendor.optional1)}&api-key=${encodeURIComponent(serviceOperator.vendor.optional2)}&domain-name=${encodeURIComponent(productName)}`;
                const premiumResp = await axios.get(premiumCheckUrl);
                const premiumData = premiumResp.data;
                customLog(req?.LogTraceId, 'info', { action: 'addProductToCart:premiumCheck', domainName: productName, premium: premiumData?.premium });
                if (premiumData?.premium === 'true') {
                    return next(new ErrorResponse('This domain is currently not available for purchase. Please try a different domain.', 400));
                }
            }
        } catch (e) {
            customLog(req?.LogTraceId, 'error', { action: 'addProductToCart:premiumCheck:failed', domainName: productName, error: e?.message });
        }
    }

    const qty = resolver.resolveQty(itemType, productQuantity, req.body);
    const billingMultiplier = resolvedBillingCycle ? resolvedBillingCycle : 1;

    // VPS addon validation and pricing
    let addonUnitPrice = 0;
    let selectedAddons = [];
    const requestedAddons = Array.isArray(req.body.addons) ? [...req.body.addons] : [];
    if (itemType === 'vps_server' && controlPanel && controlPanel !== 'none' && !requestedAddons.includes(controlPanel)) {
        requestedAddons.push(controlPanel);
    }
    if (itemType === 'vps_server' && requestedAddons.length > 0) {
        const pricingData = await getPricingData();
        const availableAddons = pricingData?.[productId]?.addons || {};
        const invalidAddons = requestedAddons.filter(a => availableAddons[a] === undefined);
        if (invalidAddons.length > 0) {
            return next(new ErrorResponse(
                `Invalid addon(s): ${invalidAddons.join(', ')}. Available: ${Object.keys(availableAddons).join(', ')}`,
                400
            ));
        }
        selectedAddons = requestedAddons;
        addonUnitPrice = parseFloat(selectedAddons.reduce((sum, a) => sum + availableAddons[a], 0).toFixed(2));
    }

    const storageMultiplier = itemType === 'backup' ? (parseInt(req.body.storageInGb) || 1) : 1;
    const totalPrice = parseFloat(((unitPrice + addonUnitPrice) * qty * billingMultiplier * storageMultiplier).toFixed(2));

    const productDetails = {
        productId,
        ...(planId ? { planId } : {}),
        itemType,
        ...(productName ? { productName } : {}),
        productQuantity: qty,
        unitPrice,
        ...(addonUnitPrice > 0 ? { addons: selectedAddons, addonUnitPrice } : {}),
        ...(itemType === 'vps_server' && controlPanel && controlPanel !== 'none' ? { controlPanel } : {}),
        totalPrice,
        ...resolver.extraFields(itemType, req.body),
        ...rest
    };

    const userData = getUserData(req);

    // Fetch cart once — reused for all checks below
    const cartForValidation = await ServiceCartUseCase.getAllProductsInMyCart(userData);
    const existingItems = (cartForValidation && cartForValidation !== -1)
        ? cartForValidation.productsArray : [];

    // ── Toggle: set to false to allow mixed service types in a single cart ────
    const ENFORCE_SINGLE_SERVICE_PER_CART = true;
    // ─────────────────────────────────────────────────────────────────────────

    if (ENFORCE_SINGLE_SERVICE_PER_CART && itemType !== 'backup' && existingItems.length > 0) {
        const hasConflict = existingItems
            .filter(i => i.itemType !== 'backup')
            .some(i => i.itemType !== itemType);
        if (hasConflict) {
            return next(new ErrorResponse(
                'Your cart already contains a different service. Please clear your cart before adding a new service type.',
                400
            ));
        }
    }

    // Enforce one item per itemType — domains are the only type that can have multiple entries
    if (itemType !== 'domain') {
        const conflict = existingItems.find(i => i.itemType === itemType);
        if (conflict) {
            return next(new ErrorResponse(
                `You already have a ${itemType.replace(/_/g, ' ')} item in your cart. Please remove it before adding a different one.`,
                400
            ));
        }
    }

    // Domain duplicate: increment billingCycle instead of quantity
    if (itemType === 'domain' && productName) {
        const existingItem = existingItems.find(i => i.itemType === 'domain' && i.productName === productName);

        if (existingItem) {
            const pricingData = await getPricingData();
            const validYears = pricingData ? getValidDomainYears(pricingData, productId) : null;
            const maxYear = validYears ? Math.max(...validYears.map(y => y.years)) : 10;
            const currentCycle = existingItem.billingCycle || 1;

            if (currentCycle >= maxYear) {
                return next(new ErrorResponse(
                    `Maximum registration period for this domain is ${maxYear} year${maxYear > 1 ? 's' : ''}`,
                    400
                ));
            }

            const newCycle = currentCycle + 1;
            const newUnitPrice = await resolver.getUnitPrice(productId, 'domain', newCycle, null);
            if (!newUnitPrice) {
                return next(new ErrorResponse('Pricing not available for this registration period', 422));
            }
            const newTotalPrice = parseFloat((newUnitPrice * newCycle).toFixed(2));

            await ServiceCartUseCase.patchCartItem(
                { productId, planId: null, productName },
                { billingCycle: newCycle, unitPrice: newUnitPrice, totalPrice: newTotalPrice },
                userData
            );

            return res.status(200).json({
                status: true,
                message: `Registration period updated to ${newCycle} year${newCycle > 1 ? 's' : ''}`,
                data: { status: 'updated', billingCycle: newCycle },
                responseCode: '000',
            });
        }
    }

    const result = await ServiceCartUseCase.addNewProductInCart(productDetails, userData);

    if (!result) {
        return next(new ErrorResponse('Something went wrong while adding item to cart', 500));
    }

    if (result === 'duplicate') {
        return res.status(200).json({
            status: true,
            message: 'Item quantity updated in cart',
            data: { status: 'updated' },
            responseCode: '000'
        });
    }

    return res.status(200).json({
        status: true,
        message: 'Item added to cart successfully',
        data: { status: 'added' },
        responseCode: '000'
    });
});

exports.updateProductInCart = asyncHandler(async (req, res, next) => {
    const {
        service = 'domainAndHosting',
        productId,
        planId = null,
        productQuantity = 1,
        operation
    } = req.body;

    if (!productId || !operation) {
        return next(new ErrorResponse('productId and operation are required', 400));
    }
    if (!['increase', 'decrease'].includes(operation)) {
        return next(new ErrorResponse("operation must be 'increase' or 'decrease'", 400));
    }

    const resolver = getResolver(service, next);
    if (!resolver) return;

    const userData = getUserData(req);
    const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
    const cartItem = cart && cart !== -1
        ? cart.productsArray.find(i => i.productId === productId && (i.planId || null) === (planId || null))
        : null;
    const itemType = cartItem?.itemType;

    if (cartItem && itemType !== 'domain') {
        const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId, planId });
        if (!plan) {
            await ServiceCartUseCase.deleteExistingProductInCart({ productId, planId }, userData);
            return res.status(200).json({
                status: true,
                message: 'This item is no longer available and has been removed from your cart',
                responseCode: '003',
                data: {}
            });
        }
    }

    if (itemType === 'shared_hosting' || itemType === 'vps_server') {
        return res.status(200).json({
            status: true,
            message: 'Product is already on cart',
            data: { newQuantity: 1 },
            responseCode: '000'
        });
    }

    const unitPrice = await resolver.getUnitPrice(productId, itemType, cartItem?.billingCycle || null, planId);
    if (!unitPrice) {
        return next(new ErrorResponse('Pricing not available for this item', 422));
    }

    const qty = parseInt(productQuantity) || 1;
    const qtyBillingMultiplier = (itemType !== 'domain' && cartItem?.billingCycle) ? cartItem.billingCycle : 1;
    const unitTotal = parseFloat((unitPrice * qty * qtyBillingMultiplier).toFixed(2));

    const params = { productId, planId, productQuantity: qty, operation, ...userData };

    const result = await ServiceCartUseCase.updateExistingProductInCart(params, unitTotal, 0);

    if (!result) {
        return next(new ErrorResponse('Something went wrong while updating the cart', 500));
    }
    if (result === -1) {
        return res.status(200).json({
            status: true,
            message: 'Item removed. Your cart is now empty.',
            data: { newQuantity: 0 },
            responseCode: '000'
        });
    }
    if (result === -2) {
        return next(new ErrorResponse('Item not found in your cart', 404));
    }

    return res.status(200).json({
        status: true,
        message: 'Cart updated successfully',
        data: { newQuantity: result.newQuantity },
        responseCode: '000'
    });
});

// Update mutable fields of a cart item — accounts, seats, billingCycle.
// Recomputes unitPrice and totalPrice based on the new values.
exports.updateCartItemDetails = asyncHandler(async (req, res, next) => {
    const {
        service = 'domainAndHosting',
        productId,
        planId = null,
        productName = null,
        domainName,
        accounts,
        seats,
        billingCycle,
        controlPanel,
    } = req.body;

    if (!productId) {
        return next(new ErrorResponse('productId is required', 400));
    }
    if (accounts === undefined && seats === undefined && billingCycle === undefined && domainName === undefined && controlPanel === undefined) {
        return next(new ErrorResponse('Provide at least one of: domainName, accounts, seats, billingCycle, controlPanel', 400));
    }

    const resolver = getResolver(service, next);
    if (!resolver) return;

    const userData = getUserData(req);
    const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
    if (!cart || cart === -1) {
        return next(new ErrorResponse('Cart is empty', 400));
    }

    const cartItem = cart.productsArray.find(i => {
        if (i.productId !== productId) return false;
        if ((i.planId || null) !== (planId || null)) return false;
        if (i.itemType === 'domain') return (i.productName || null) === (productName || null);
        return true;
    });
    if (!cartItem) {
        return next(new ErrorResponse('Item not found in cart', 404));
    }

    if (cartItem.itemType !== 'domain') {
        const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId, planId });
        if (!plan) {
            await ServiceCartUseCase.deleteExistingProductInCart({ productId, planId }, userData);
            return res.status(200).json({
                status: true,
                message: 'This item is no longer available and has been removed from your cart',
                responseCode: '003',
                data: {}
            });
        }
    }

    const newBillingCycle = billingCycle ? parseInt(billingCycle) : cartItem.billingCycle || null;

    if (billingCycle) {
        const { valid, validCycles, validYears } = await resolver.validateBillingCycle(productId, planId, parseInt(billingCycle), cartItem.itemType);
        if (!valid) {
            return next(new ErrorResponse(
                validYears
                    ? `Invalid registration period. Allowed values: ${validYears.join(', ')} year(s)`
                    : validCycles
                    ? `Invalid billingCycle. Allowed values for this plan: ${validCycles.join(', ')} month(s)`
                    : 'Invalid billingCycle. Pricing not available for this plan.',
                400
            ));
        }
    }

    const unitPrice = await resolver.getUnitPrice(productId, cartItem.itemType, newBillingCycle, planId);
    if (!unitPrice) {
        return next(new ErrorResponse('Pricing not available for this item', 422));
    }

    const patches = {};

    if (cartItem.itemType === 'titan_email') {
        patches.accounts = accounts !== undefined ? parseInt(accounts) : cartItem.accounts || 1;
        patches.productQuantity = patches.accounts;
    }
    if (cartItem.itemType === 'google_workspace') {
        patches.seats = seats !== undefined ? parseInt(seats) : cartItem.seats || 1;
        patches.productQuantity = patches.seats;
    }
    if (newBillingCycle) patches.billingCycle = newBillingCycle;
    if (domainName) patches.domainName = domainName;

    patches.unitPrice = unitPrice;
    const updatedBillingMultiplier = newBillingCycle ? newBillingCycle : 1;

    let resolvedAddonUnitPrice = cartItem.addonUnitPrice || 0;
    if (cartItem.itemType === 'vps_server' && controlPanel !== undefined) {
        const pricingData = await getPricingData();
        const availableAddons = pricingData?.[productId]?.addons || {};
        const existingAddons = (cartItem.addons || []).filter(a => a !== cartItem.controlPanel);
        const newAddons = controlPanel && controlPanel !== 'none'
            ? [...existingAddons, controlPanel]
            : existingAddons;
        resolvedAddonUnitPrice = parseFloat(newAddons.reduce((sum, a) => sum + (availableAddons[a] || 0), 0).toFixed(2));
        if (newAddons.length !== (cartItem.addons || []).length || resolvedAddonUnitPrice !== (cartItem.addonUnitPrice || 0)) {
            patches.addons = newAddons;
            patches.addonUnitPrice = resolvedAddonUnitPrice;
        }
    }

    patches.totalPrice = parseFloat(((unitPrice + resolvedAddonUnitPrice) * (patches.productQuantity || cartItem.productQuantity) * updatedBillingMultiplier).toFixed(2));

    const result = await ServiceCartUseCase.patchCartItem({ productId, planId, productName: cartItem.itemType === 'domain' ? (cartItem.productName || null) : null }, patches, userData);
    if (!result) {
        return next(new ErrorResponse('Something went wrong while updating the cart', 500));
    }
    if (result === -2) {
        return next(new ErrorResponse('Item not found in cart', 404));
    }

    // When a VPS billing cycle changes, sync any linked Acronis backup to the same cycle
    if (cartItem.itemType === 'vps_server' && patches.billingCycle) {
        try {
            const latestCart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
            if (latestCart && latestCart !== -1) {
                const linkedBackup = latestCart.productsArray.find(
                    i => i.itemType === 'backup' && i.vpsProductId === productId
                );
                if (linkedBackup) {
                    const backupGb = linkedBackup.storageInGb || 1;
                    const backupUnitPrice = linkedBackup.unitPrice || 0;
                    const newBackupTotal = parseFloat((backupUnitPrice * backupGb * patches.billingCycle).toFixed(2));
                    await ServiceCartUseCase.patchCartItem(
                        { productId: linkedBackup.productId, planId: linkedBackup.planId || null, productName: null },
                        { billingCycle: patches.billingCycle, totalPrice: newBackupTotal },
                        userData
                    );
                }
            }
        } catch (err) {
            customLog(req?.LogTraceId, 'error', { action: 'updateCartItemDetails:syncBackupBillingCycle', error: err?.message });
        }
    }

    // Propagate domainName to all other non-domain cart items
    if (patches.domainName) {
        const latestCart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
        if (latestCart && latestCart !== -1) {
            for (const other of latestCart.productsArray) {
                if (other.itemType === 'domain') continue;
                if (other.productId === productId && (other.planId || null) === (planId || null)) continue;
                if (other.domainName === patches.domainName) continue;
                await ServiceCartUseCase.patchCartItem(
                    { productId: other.productId, planId: other.planId || null, productName: null },
                    { domainName: patches.domainName },
                    userData
                );
            }
        }
    }

    return res.status(200).json({
        status: true,
        message: 'Cart item updated successfully',
        data: result,
        responseCode: '000',
    });
});

exports.deleteProductFromCart = asyncHandler(async (req, res, next) => {
    const { productId, planId = null, productName = null, itemType = null } = req.query;

    if (!productId) {
        return next(new ErrorResponse('productId query param is required', 400));
    }

    const userData = getUserData(req);
    const result = await ServiceCartUseCase.deleteExistingProductInCart({ productId, planId, productName }, userData);

    if (result === false) {
        return next(new ErrorResponse('Something went wrong while removing item from cart', 500));
    }
    if (result === -2) {
        return next(new ErrorResponse('Item not found in your cart', 404));
    }

    // When a VPS server is removed, also remove any linked Acronis backup items
    if (itemType === 'vps_server') {
        try {
            const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
            if (cart && cart !== -1 && cart.productsArray) {
                const linkedBackups = cart.productsArray.filter(
                    i => i.itemType === 'backup' && i.vpsProductId === productId
                );
                for (const backup of linkedBackups) {
                    await ServiceCartUseCase.deleteExistingProductInCart(
                        { productId: backup.productId, planId: backup.planId || null },
                        userData
                    );
                }
            }
        } catch (err) {
            // Non-fatal: log but don't fail the response
            customLog(req?.LogTraceId, 'error', { action: 'deleteProductFromCart:removeLinkedBackup', error: err?.message });
        }
    }

    return res.status(200).json({
        status: true,
        message: result === -1
            ? 'Item removed. Your cart is now empty.'
            : 'Item removed from cart successfully',
        data: {},
        responseCode: '000'
    });
});

exports.getAllProductsInCart = asyncHandler(async (req, res, next) => {
    const { isCustomerFetch, service = 'domainAndHosting' } = req.query;
    const userData = getUserData(req);
    const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);

    if (!cart) {
        return next(new ErrorResponse('Something went wrong while fetching the cart', 500));
    }

    if (cart === -1) {
        return res.status(200).json({
            status: true,
            message: 'Your cart is empty. Add some items to it!',
            responseCode: '002',
            data: {
                items: [],
                count: 0,
                cartId: 0,
                itemsTotalAmount: 0,
                allowCheckout: false
            }
        });
    }

    const { cartId, productsArray } = cart;

    const purged = await purgeInvalidCartItems(userData, productsArray);
    const validItems = purged.length > 0
        ? productsArray.filter(i => !purged.some(r => r.productId === i.productId && (r.planId || null) === (i.planId || null)))
        : productsArray;

    // Enrich plan-based items with valid billing cycle options + price per month for the dropdown
    let pricingData = null;
    try { pricingData = await getPricingData(); } catch { /* non-fatal */ }

    const enrichedItems = validItems.map(item => {
        if (!pricingData || !item.productId) return item;

        if (item.itemType === 'domain') {
            const validYears = getValidDomainYears(pricingData, item.productId);
            return validYears ? { ...item, validYears } : item;
        }

        const PLAN_ITEM_TYPES = ['vps_server', 'shared_hosting', 'titan_email', 'google_workspace'];
        if (!PLAN_ITEM_TYPES.includes(item.itemType)) return item;
        if (!item.planId) return item;

        const cycles = getValidBillingCycles(pricingData, item.productId, item.itemType, item.planId);
        if (!cycles) return item;

        const pricingDetails = resolvePlanPricingDetails(pricingData, item.productId, item.planId);
        const validBillingCycles = cycles.map(months => ({
            months,
            pricePerMonth: pricingDetails?.add?.[String(months)] ?? null,
        }));

        const availableAddons = pricingData?.[item.productId]?.addons || null;

        return { ...item, validBillingCycles, availableAddons };
    });

    // Propagate domainName: if any non-domain item has a domainName, apply to others that don't
    const sharedDomainName = enrichedItems.find(i => i.itemType !== 'domain' && i.domainName)?.domainName || null;
    let finalItems = enrichedItems;
    if (sharedDomainName) {
        const needsDomain = enrichedItems.filter(i => i.itemType !== 'domain' && !i.domainName);
        if (needsDomain.length > 0) {
            for (const item of needsDomain) {
                await ServiceCartUseCase.patchCartItem(
                    { productId: item.productId, planId: item.planId || null, productName: null },
                    { domainName: sharedDomainName },
                    userData
                );
            }
            finalItems = enrichedItems.map(i =>
                i.itemType !== 'domain' && !i.domainName ? { ...i, domainName: sharedDomainName } : i
            );
        }
    }

    const subtotal = parseFloat(
        finalItems.reduce((sum, i) => sum + parseFloat(i.totalPrice || 0), 0).toFixed(2)
    );
    const itemsTotalAmount = subtotal;

    // Fetch vendor customer details if requested and service is domainAndHosting
    let customerDetails = null;
    if (isCustomerFetch === 'true' && service === 'domainAndHosting') {
        try {
            const credentialId = req.user.id;
            const corporateUser = await findCorporateUser({ id: credentialId }, ["domainHostingMeta"]);
            const meta = corporateUser?.domainHostingMeta || {};
            const vendorCustomerId = meta.customerId;

            // Only treat as a complete registration if all credentials are present
            // (partial meta means re-registration is needed for SSO to work)
            if (vendorCustomerId && meta.username && meta.passwd) {
                const serviceOperator = await findServiceOperatorByAccessKey(operatorsData['domainAndHosting']['accessKey']);
                if (serviceOperator && !serviceOperator.error) {
                    const query = Object.entries({
                        'auth-userid': serviceOperator.vendor.optional1,
                        'api-key': serviceOperator.vendor.optional2,
                        'customer-id': vendorCustomerId,
                    }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
                    const response = await axios.get(`${serviceOperator.vendor.apiUrl}/api/customers/details-by-id.json?${query}`);
                    customerDetails = response.data;
                }
            }
        } catch (err) {
            customLog(req?.LogTraceId, 'error', { action: 'getAllProductsInCart:fetchCustomerDetails', error: err?.message });
        }
    }

    return res.status(200).json({
        status: true,
        message: 'Service cart retrieved successfully',
        responseCode: '000',
        data: {
            items: finalItems,
            count: finalItems.length,
            cartId,
            itemsTotalAmount,
            allowCheckout: finalItems.length > 0,
            ...(isCustomerFetch === 'true' ? { customerDetails: customerDetails ?? false } : {}),
        }
    });
});

exports.clearCart = asyncHandler(async (req, res) => {
    const userData = getUserData(req);
    await ServiceCartUseCase.clearCart(userData);

    return res.status(200).json({
        status: true,
        message: 'Service cart cleared',
        data: {},
        responseCode: '000'
    });
});

exports.refreshCart = asyncHandler(async (req, res) => {
    const userData = getUserData(req);
    const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);

    if (!cart || cart === -1) {
        return res.status(200).json({
            status: true,
            message: 'Cart is empty',
            responseCode: '002',
            data: { removedItems: [], remainingCount: 0 }
        });
    }

    const removedItems = [];
    for (const item of cart.productsArray) {
        if (item.itemType === 'domain') continue;

        const plan = await DomainHostingPlansUseCase.findByVendorKey({ productId: item.productId, planId: item.planId });
        if (!plan) {
            await ServiceCartUseCase.deleteExistingProductInCart({ productId: item.productId, planId: item.planId }, userData);
            removedItems.push({ productId: item.productId, planId: item.planId, itemType: item.itemType });
        }
    }

    const updatedCart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
    const remainingCount = updatedCart === -1 ? 0 : (updatedCart?.productsArray?.length || 0);

    return res.status(200).json({
        status: true,
        message: removedItems.length
            ? `${removedItems.length} unavailable item(s) removed from your cart`
            : 'Cart is up to date',
        responseCode: '000',
        data: { removedItems, remainingCount }
    });
});
