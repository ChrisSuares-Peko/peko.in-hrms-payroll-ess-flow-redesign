const ALL_MODES = ["MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP"];

// Only services whose prices carry a markup are listed; every other service is Margin only.
const SUPPORTED_COMMISSION_MODES = {
    peko_works: ALL_MODES,
    esim_tunz: ALL_MODES,
    workspace: ALL_MODES,
    hike_service: ALL_MODES,
    email_domain_service: ALL_MODES,
    business_registration: ALL_MODES,
    JRI_prepaid: ALL_MODES,
    whatsApp_for_busines: ALL_MODES,
    ecommerce_store: ALL_MODES,
    car_report: ALL_MODES,
    gov_services: ALL_MODES,
    tbo_airline: ALL_MODES,
    shipment_services: ALL_MODES,
    visa_api: ALL_MODES,
};

const DEFAULT_COMMISSION_MODES = ["MARGIN"];

const getSupportedCommissionModes = accessKey =>
    Object.prototype.hasOwnProperty.call(SUPPORTED_COMMISSION_MODES, accessKey)
        ? [...SUPPORTED_COMMISSION_MODES[accessKey]]
        : [...DEFAULT_COMMISSION_MODES];

module.exports = { SUPPORTED_COMMISSION_MODES, getSupportedCommissionModes };
