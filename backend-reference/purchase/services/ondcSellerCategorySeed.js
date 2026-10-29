const { seedSellerCategoriesFromProducts } = require("../models/use-cases/ondc_seller_category");
const { recomputeVisibility } = require("./ondcProductVisibility");
const { customLog } = require("../utils/loggerHelper");

/**
 * Boot-time switch to admin-decided seller categories: when
 * ondcSellerCategories is still empty, list every stored seller category as
 * unmapped (see seedSellerCategoriesFromProducts), then stamp every product's
 * hidden reason once — existing products stay hidden until their category is
 * mapped on Products > Review. Safe to run on every boot and on several
 * instances at once — it does nothing when the table already has rows.
 */
const runSellerCategorySeed = async () => {
    try {
        const result = await seedSellerCategoriesFromProducts();
        if (!result) return null;
        const changed = await recomputeVisibility({});
        customLog(null, "info", {
            scope: "ondcSellerCategories",
            step: "seeded",
            message: "Stored seller categories listed for review (all unmapped)",
            ...result,
            productsRestamped: changed,
        }, "VENDOR");
        return { ...result, productsRestamped: changed };
    } catch (error) {
        customLog(null, "error", {
            scope: "ondcSellerCategories",
            step: "seed-failed",
            error: error?.message || String(error),
        }, "VENDOR");
        return null;
    }
};

// Ingest waits on this: a catalog that created the first seller category
// before the seed ran would make the seed skip (table no longer empty).
const seedDone = process.env.NODE_ENV === "test"
    ? Promise.resolve(null)
    : new Promise((resolve) => setImmediate(() => runSellerCategorySeed().then(resolve)));

const waitForSellerCategorySeed = () => seedDone;

module.exports = { runSellerCategorySeed, waitForSellerCategorySeed };
