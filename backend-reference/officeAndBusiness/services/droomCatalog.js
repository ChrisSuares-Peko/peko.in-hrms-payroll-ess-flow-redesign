/**
 * Droom MYBIZ catalog proxy — category → make → model → year → trim lookup
 * for the Car Reports feature (Valuation + Inspection forms).
 *
 * Auth, token caching and the multipart transport live in droomClient.js, shared
 * with the other Droom services (droomHistory.js, droomInspection.js, droomPaasReport.js).
 *
 * See DROOM_MYBIZ_API_REFERENCE.md (workspace root) §2 for the endpoint reference —
 * response shapes for the catalog endpoint specifically are unconfirmed and must be
 * verified against a live call before trusting the normalization in
 * controllers/corporate/carReportCatalog.js.
 */
const { postDroomForm } = require('./droomClient');

const CATALOG_PATH = '/dss/enterprise-catalog';

// Returns the vendor's raw response body for the given cascade level. The controller
// is responsible for normalizing it into Peko's standard response envelope — the exact
// shape Droom returns per level (array of strings? {label,value}[]? something nested?)
// is unconfirmed, see the module doc comment above.
//
// category is required by the vendor at every level; make/model/year are added as
// each level of the cascade is chosen, and postDroomForm drops the empty ones — which
// is what tells Droom which level to answer with.
exports.getCatalog = async ({ category, make, model, year }, logTraceId = null) =>
    postDroomForm(CATALOG_PATH, { category, make, model, year }, logTraceId);
