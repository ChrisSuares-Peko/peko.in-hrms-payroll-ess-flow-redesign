/**
 * Default ONDC cities: the ~50 cities the scheduler pre-fetches office-supply
 * catalogs for on every run. Curated sections (Top Deals) are served ONLY for
 * these cities — everywhere else the catalog loads on demand and Top Deals is
 * omitted. The list lives in ondcOfficeSupplies.json (`default_cities`), which
 * the scheduler service mirrors.
 */
const officeSupplies = require("./ondcOfficeSupplies.json");

const DEFAULT_ONDC_CITIES = officeSupplies.default_cities || [];

const DEFAULT_ONDC_CITY_CODES = new Set(
  DEFAULT_ONDC_CITIES.map((c) => String(c.code).toLowerCase())
);

/** True when the ONDC city code (e.g. "std:080") is one of the default cities. */
const isDefaultOndcCity = (city) =>
  DEFAULT_ONDC_CITY_CODES.has(String(city || "").trim().toLowerCase());

module.exports = { DEFAULT_ONDC_CITIES, DEFAULT_ONDC_CITY_CODES, isDefaultOndcCity };
