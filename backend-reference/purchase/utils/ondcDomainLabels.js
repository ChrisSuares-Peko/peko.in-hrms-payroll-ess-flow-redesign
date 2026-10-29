const { toOndcContextDomain } = require("./ondc_helper");

/** Display names for ONDC retail domain codes (Rules tab › Domains we ingest). */
const ONDC_DOMAIN_LABELS = {
    "ONDC:RET10": "Grocery",
    "ONDC:RET11": "Food & Beverage",
    "ONDC:RET12": "Fashion",
    "ONDC:RET13": "Beauty & Personal Care",
    "ONDC:RET14": "Electronics",
    "ONDC:RET15": "Appliances",
    "ONDC:RET16": "Home & Kitchen",
    "ONDC:RET17": "Toys & Games",
    "ONDC:RET18": "Health & Wellness",
    "ONDC:RET19": "Pharma",
    "ONDC:RET1B": "Hardware & Industrial",
    "ONDC:RET1E": "Packaging",
};

/** `RET16` / `ondc:ret16` → `ONDC:RET16`; null when empty. */
const toDomainCode = (domain) => toOndcContextDomain(domain);

const domainLabel = (code) => ONDC_DOMAIN_LABELS[toDomainCode(code)] || toDomainCode(code) || null;

module.exports = { ONDC_DOMAIN_LABELS, toDomainCode, domainLabel };
