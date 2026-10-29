/**
 * The item rows an Office Supplies email shows: name, quantity, line price and a
 * thumbnail.
 *
 * Name/qty/price follow the SAME precedence resolveOndcOrderItems uses for the
 * Order Details page (controllers/corporate/ondcEcommerce.js): `quote.rows` wins
 * over the cart snapshot, because the quote is what the seller accepted and what
 * the buyer was actually charged for — a seller that ran out of stock simply omits
 * its line, and the cart snapshot would still list it.
 *
 * The image is the one thing not on the order row, so it needs a join to the
 * catalog snapshot (ondcProducts, keyed transactionId + ondcProductId). That query
 * is wrapped so it can never cost the email: a missing image is the NORMAL case for
 * older orders — scheduler/services/ondcProductPurge.js deletes those rows — and
 * the template renders a neutral placeholder cell for null.
 */

const { Op } = require("sequelize");
const ondcProducts = require("../models/entities/ondc_product_with_transactionId");

const asArray = (value) => (Array.isArray(value) ? value : []);

const firstImage = (product) => {
  if (!product) return null;
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const candidate = images[0] || product.symbol || null;
  return candidate ? String(candidate) : null;
};

/**
 * Name/qty/price only — no DB access, so callers that don't want images (or are
 * inside a tight webhook path) can use this directly.
 *
 * @param {Object} row an ondcOrders row
 * @returns {Array<{itemId, ondcProductId, productName, quantity, price}>}
 */
const resolveEmailItemRows = (row = {}) => {
  const fromQuote = asArray(row?.quote?.rows).filter((r) => r && r.titleType === "item");
  const cartByName = new Map(
    asArray(row?.items)
      .filter((i) => i && i.productName)
      .map((i) => [String(i.productName), i])
  );

  if (fromQuote.length) {
    return fromQuote.map((r) => {
      // Sellers title item rows with just the variant ("1 Kg"); mapQuote already
      // enriched the row with our catalog name wherever the cart item matched.
      const productName = r.productName || r.title || null;
      const cartItem = cartByName.get(String(productName));
      return {
        itemId: r.itemId || null,
        // The image join needs the catalog id, which only the cart snapshot has.
        ondcProductId: cartItem?.ondcProductId || r.itemId || null,
        productName,
        quantity: r.quantity || null,
        price: r.amount ?? null,
      };
    });
  }

  return asArray(row?.items).map((i) => ({
    itemId: i.ondcProductId || null,
    ondcProductId: i.ondcProductId || null,
    productName: i.productName || null,
    quantity: parseInt(i.productQuantity, 10) || null,
    // Nothing on this path was ever priced line-by-line.
    price: null,
  }));
};

/**
 * The same rows, each with `image` filled in where the catalog snapshot still has
 * one. Never throws and never returns fewer rows than resolveEmailItemRows.
 *
 * @param {Object} row an ondcOrders row
 * @returns {Promise<Array<{productName, quantity, price, image}>>}
 */
const buildEmailItemRows = async (row = {}) => {
  const rows = resolveEmailItemRows(row);
  if (!rows.length) return rows;

  try {
    const ids = [...new Set(rows.map((r) => r.ondcProductId).filter(Boolean).map(String))];
    if (!ids.length || !row?.transactionId) {
      return rows.map((r) => ({ ...r, image: null }));
    }

    const products = await ondcProducts.findAll({
      where: { transactionId: String(row.transactionId), ondcProductId: { [Op.in]: ids } },
      attributes: ["ondcProductId", "images", "symbol"],
      raw: true,
    });
    const imageById = new Map(products.map((p) => [String(p.ondcProductId), firstImage(p)]));

    return rows.map((r) => ({
      ...r,
      image: r.ondcProductId ? imageById.get(String(r.ondcProductId)) || null : null,
    }));
  } catch (_) {
    // An email with no thumbnails still does its job; one that throws sends nothing.
    return rows.map((r) => ({ ...r, image: null }));
  }
};

/**
 * "Blue A4 Paper × 2, Stapler × 1" — the one-line form for subjects, logs, and the
 * return emails' item list. Extracted from the inline idiom that returnOndcOrder
 * and getOndcOrderHistory each had their own copy of.
 */
const summariseItems = (rows) =>
  asArray(rows)
    .filter((r) => r && r.productName)
    .map((r) => `${r.productName}${r.quantity ? ` × ${r.quantity}` : ""}`)
    .join(", ");

module.exports = {
  resolveEmailItemRows,
  buildEmailItemRows,
  summariseItems,
};
