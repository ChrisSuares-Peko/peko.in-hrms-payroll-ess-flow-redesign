/**
 * Droom MYBIZ RC-details proxy — the vehicle background data behind the Car Reports
 * History product.
 *
 * Auth and transport live in droomClient.js, shared with the catalog and OBV proxies.
 *
 * See DROOM_MYBIZ_API_REFERENCE.md (workspace root) §4. Unlike every other Droom endpoint
 * Peko calls, this one is a GET with a query string rather than a multipart POST, and it
 * needs nothing but the registration number — no catalog cascade, no resolved trim.
 *
 * The captured sample response is explicitly trimmed to the fields the History card
 * needs; the live body also carries chassis/engine numbers, RC expiry, owner address and
 * more, whose key names are not recorded anywhere. Callers persist the raw body so those
 * fields can be surfaced later without re-purchasing the report.
 */
const { getDroomJson } = require('./droomClient');

const RC_DETAILS_PATH = '/dss/v1/vehicle-rc-details';
const CHALLAN_DETAILS_PATH = '/dss/v1/vehicle-challan-details';
const RC_CHALLAN_REPORT_PATH = '/dss/v1/vehicle-rc-challan-report';

// Returns Droom's raw `{ code, data, message }` envelope. Normalisation and the
// "is this plate resolvable" decision are the caller's — see normaliseHistoryResult in
// utils/carReport.js.
exports.getVehicleRcDetails = async (registrationNumber, logTraceId = null) =>
    getDroomJson(RC_DETAILS_PATH, { rc_number: registrationNumber }, logTraceId);

// Challans against a plate (OBV_History_API_Doc). Same envelope, but `data` is an array
// of challan records — and a vehicle with NO challans comes back as 200 with
// code "failed" / "Data not found", so callers must not read that as an error.
exports.getVehicleChallanDetails = async (registrationNumber, logTraceId = null) =>
    getDroomJson(CHALLAN_DETAILS_PATH, { rc_number: registrationNumber }, logTraceId);

// The vendor-generated history PDF ("platinum history report"). Synchronous — the
// response carries the CDN link directly, in `data.report_path` despite it being a
// full URL.
exports.getVehicleRcChallanReport = async (registrationNumber, logTraceId = null) =>
    getDroomJson(RC_CHALLAN_REPORT_PATH, { rc_number: registrationNumber }, logTraceId);
