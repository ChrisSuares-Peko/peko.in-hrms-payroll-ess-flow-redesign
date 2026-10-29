// Registry of per-accessKey plan/commission tables for "Service With Plans" accounting
// services. Each service keeps its own plan entity with its own table/columns, so this
// config describes how to read/write each one; accountingPlans.js has the generic
// reader/writer that consumes it.
module.exports = {
    peko_works: {
        table: 'work_plans',
        nameColumn: 'name',
        priceColumn: 'price',
        priceEditable: true,
        joins: `
            LEFT JOIN works ON works.id = work_plans.workId
            LEFT JOIN credentials workCredential ON workCredential.id = works.credentialId
            LEFT JOIN credentials registeredByCredential ON registeredByCredential.id = workCredential.registeredBy
        `,
        extraColumns: {
            workName: 'works.name',
            partnerName: "COALESCE(registeredByCredential.name, 'Default')",
        },
        partnerFilterColumn: 'registeredByCredential.id',
        extraSearchColumns: ['works.name'],
    },
    esim_tunz: { table: 'esimPlans', nameColumn: 'name', priceColumn: 'amount' },
    workspace: { table: 'plans', nameColumn: 'name', priceColumn: 'price', priceEditable: true },
    hike_service: {
        table: 'hikes',
        nameColumn: 'name',
        priceColumn: 'amount',
        priceEditable: true,
        // hikes.partners is an uploaded logo image URL, not a partner name.
        joins: `
            LEFT JOIN credentials hikeCredential ON hikeCredential.id = hikes.credentialId
            LEFT JOIN credentials registeredByCredential ON registeredByCredential.id = hikeCredential.registeredBy
        `,
        extraColumns: {
            planType: 'hikes.planType',
            partnerName: "COALESCE(registeredByCredential.name, 'Default')",
        },
        partnerFilterColumn: 'registeredByCredential.id',
    },
    email_domain_service: {
        table: 'softwares_subscriptions_plans',
        nameColumn: 'name',
        priceColumn: 'monthlyPrice',
        priceEditable: true,
        annualPriceColumn: 'yearlyPrice',
        extraColumns: {
            annualPrice: 'softwares_subscriptions_plans.yearlyPrice',
        },
    },
    xoxoday: {
        table: 'giftCards',
        nameColumn: 'product_name',
        priceRangeColumns: { min: 'min_price', max: 'max_price' },
    },
    business_registration: {
        table: 'businessRegistrationCatalogs',
        nameColumn: 'serviceName',
        customAmountColumn: 'businessRegistrationCatalogs.amount',
        extraColumns: {
            variantName: 'businessRegistrationCatalogs.variantName',
            vendorPrice: 'businessRegistrationCatalogs.vendorPrice',
        },
        extraSearchColumns: ['businessRegistrationCatalogs.variantName'],
    },
    JRI_prepaid: {
        table: 'mobileRechargeProviders',
        nameColumn: 'providerName',
        extraColumns: {
            displayName: 'mobileRechargeProviders.displayName',
        },
    },
    whatsApp_for_busines: {
        table: 'packages',
        nameColumn: 'packageName',
        where: "packages.accessCode = 'whatsapp'",
        accessCode: 'whatsapp',
        joins: 'LEFT JOIN credentials ON credentials.id = packages.partnerId',
        priceJsonColumn: 'packages.packagePrices',
        priceJsonKeys: { monthlyPrice: 'monthly', annualPrice: 'annually' },
        priceEditable: true,
        discountJsonColumn: 'packages.discount',
        discountJsonKeys: { monthlyDiscount: 'monthly', annualDiscount: 'annually' },
        extraColumns: {
            partnerName: "COALESCE(credentials.name, 'Default')",
        },
        partnerFilterColumn: 'credentials.id',
        splitCommissionColumn: 'planCommissions',
        // The add-ons are `settings` rows (details: amount + the commission fields), listed in the Add-ons tab.
        addOns: [
            { type: 'BOT_BUILDER', name: 'Bot Builder', settingName: 'flowBuilder' },
            { type: 'SHOPIFY_INTEGRATION', name: 'Shopify Integration', settingName: 'shopifyIntegration' },
        ],
    },
    ecommerce_store: {
        table: 'packages',
        nameColumn: 'packageName',
        where: "packages.accessCode = 'ecommerce_store'",
        accessCode: 'ecommerce_store',
        priceJsonColumn: 'packages.packagePrices',
        priceJsonKeys: { monthlyPrice: 'monthly', annualPrice: 'annually' },
        priceEditable: true,
        discountJsonColumn: 'packages.discount',
        discountJsonKeys: { monthlyDiscount: 'monthly', annualDiscount: 'annually' },
        splitCommissionColumn: 'planCommissions',
    },
    // No price column — pricing is never stored, only resolved live from the vendor's cache
    // (see paymentGateway/officeAndBusiness's resolveDomainHostingPrice.js).
    domain_and_hosting: {
        table: 'domainHostingPlans',
        nameColumn: 'planName',
        extraColumns: {
            planType: 'domainHostingPlans.planType',
            productId: 'domainHostingPlans.productId',
        },
        extraSearchColumns: ['domainHostingPlans.productId'],
        serviceCommissionItems: 'domain registrations',
    },
    car_report: {
        table: 'carReportPlans',
        nameColumn: 'displayName',
        priceColumn: 'price',
        priceEditable: true,
        // The active plans are cached here (read by officeAndBusiness, payment and paymentGateway).
        cacheKey: 'car_report_plans_active',
        extraColumns: {
            reportType: 'carReportPlans.reportType',
            packageId: 'carReportPlans.packageId',
        },
        extraSearchColumns: ['carReportPlans.packageId'],
    },
    gov_services: {
        table: 'govtServicesCatalogs',
        nameColumn: 'serviceName',
        customAmountColumn: 'govtServicesCatalogs.amount',
        extraColumns: {
            variantName: 'govtServicesCatalogs.variantName',
            vendorPrice: 'govtServicesCatalogs.price',
        },
        extraSearchColumns: ['govtServicesCatalogs.variantName'],
    },
};
