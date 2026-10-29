const classifiedList = field =>
    `COALESCE((SELECT JSON_EXTRACT(settings.details, '$.${field}') FROM settings ` +
    "WHERE settings.name = 'servicesTypeConfig' LIMIT 1), JSON_ARRAY())";

const listedIn = (field, column) =>
    `JSON_CONTAINS(${classifiedList(field)}, JSON_QUOTE(COALESCE(${column}, '')))`;

const isVendorService = (column = "serviceOperators.accessKey") =>
    `(${listedIn("service_with_plans", column)} OR ${listedIn("service_without_plans", column)})`;

const isPekoOwnService = (column = "serviceOperators.accessKey") =>
    listedIn("peko_service_subscriptions", column);

const isListedVendorService = (column = "serviceOperators.accessKey") =>
    `(${isVendorService(column)} OR ${listedIn("peko_subscription_vendors", column)})`;

module.exports = { isVendorService, isPekoOwnService, isListedVendorService };
