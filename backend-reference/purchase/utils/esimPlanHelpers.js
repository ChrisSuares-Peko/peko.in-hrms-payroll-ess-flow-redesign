const { customLog } = require("./loggerHelper");

// Tunz region countrySet codes → display labels.
// All region codes are 3 letters, so they can never collide with ISO alpha-2 country codes.
const REGIONS = {
    EUR: "Europe",
    ASA: "Asia",
    CAT: "Central Asia",
    MEA: "Middle East & North Africa",
    AFR: "Africa",
    LAT: "Latin America",
    NOA: "North America",
    OCE: "Oceania",
    CAR: "Caribbean",
    WWL: "Worldwide Lite",
    WWW: "Worldwide Max",
    HAJ: "Hajj and Umrah",
    FSP: "Fan Season Pass",
    SAF: "Safari",
};

const REGION_LABEL_TO_CODE = Object.fromEntries(
    Object.entries(REGIONS).map(([code, label]) => [label, code])
);

// Countries that must never be shown or sold anywhere in the eSIM flows
const EXCLUDED_COUNTRY_CODES = new Set(["PK"]);
const EXCLUDED_COUNTRY_NAMES = new Set(["pakistan"]);

function isExcludedCountry(country) {
    if (!country) return false;
    const value = String(country).trim();
    return (
        EXCLUDED_COUNTRY_CODES.has(value.toUpperCase()) ||
        EXCLUDED_COUNTRY_NAMES.has(value.toLowerCase())
    );
}

// Country plans have countrySet === their own ISO code; region sets never appear in includedCountries
function isRegionalPlan(plan) {
    if (REGIONS[plan.coverageId]) return true;

    const codes = (plan.includedCountries || []).map(c => c.code);
    if (codes.length > 1 && !codes.includes(plan.coverageId)) {
        customLog(null, "error", {
            message: "[ESIM] Unknown region countrySet — add to REGIONS map in esimPlanHelpers",
            coverageId: plan.coverageId,
            planName: plan.name,
        });
        return true;
    }
    return false;
}

function getRegionLabel(coverageId, planName) {
    return REGIONS[coverageId] || (planName ? planName.split(",")[0].trim() : coverageId);
}

module.exports = { REGIONS, REGION_LABEL_TO_CODE, isRegionalPlan, getRegionLabel, isExcludedCountry };
