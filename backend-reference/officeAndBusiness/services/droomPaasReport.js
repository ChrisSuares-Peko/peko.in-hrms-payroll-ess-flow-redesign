// Droom PaaS (OBV premium) report — the async PDF behind the Valuation product.
// Create returns an order_id; completion arrives via webhook or the status poll.
const { postDroomJson, getDroomJson } = require('./droomClient');

const CREATE_PATH = '/dss/v2/paas-report';
const STATUS_PATH = '/dss/v2/paas-report-status';

// Peko's fixed partner id on Droom's side.
const COMPANY_ID = process.env.DROOM_COMPANY_ID || '1109';

// `owners` mirrors the vendor sample (a name); semantics unconfirmed with Droom.
exports.createPaasReport = async (
    { make, model, year, trim, city, owners, kmsDriven, category },
    logTraceId = null
) =>
    postDroomJson(
        CREATE_PATH,
        {
            make,
            model,
            // The vendor sample sends year and kms as numbers.
            year: Number(year),
            trim,
            city,
            owners,
            kms_driven: Number(kmsDriven),
            category,
        },
        logTraceId
    );

exports.getPaasReportStatus = async (orderId, logTraceId = null) =>
    getDroomJson(STATUS_PATH, { company_id: COMPANY_ID, order_id: orderId }, logTraceId);
