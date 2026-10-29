/**
 * Default `enabled` for a newly seen seller NP (ondcSellerNps insert / backfill).
 * Live ingest uses the row's `enabled` flag, not this helper.
 * Match is on context.bpp_id only (hostnames like ondcseller-prod.costbo.com).
 */
const ALLOWED_BPP_TOKENS = [
  "shopclues",
  "dpanda",
  "costbo",
  "mystore",
  "shiprocket",
];

const WORKBENCH_BPP_ID = "workbench.ondc.tech";

const isAllowedCatalogBpp = ({ bppId } = {}) => {
  const id = String(bppId || "").trim().toLowerCase();
  if (!id) return false;
  if (id === WORKBENCH_BPP_ID) return true;
  return ALLOWED_BPP_TOKENS.some((token) => id.includes(token));
};

module.exports = {
  ALLOWED_BPP_TOKENS,
  WORKBENCH_BPP_ID,
  isAllowedCatalogBpp,
};
