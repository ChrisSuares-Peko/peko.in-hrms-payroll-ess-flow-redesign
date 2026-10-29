const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const ondcSellers = require("../entities/ondc_seller");

/**
 * Batch lookup for a checkout's seller groups — one query instead of N.
 * `keys` is `[{ bppId, providerId }, …]`; results are keyed `bppId|providerId`.
 */
exports.findOndcSellersByKeys = asyncHandler(async (keys = []) => {
  const usable = keys.filter((key) => key?.bppId && key?.providerId);
  if (!usable.length) return new Map();

  const rows = await ondcSellers.findAll({
    where: {
      [Op.or]: usable.map(({ bppId, providerId }) => ({ bppId, providerId })),
    },
    raw: true,
  });
  return new Map(rows.map((row) => [`${row.bppId}|${row.providerId}`, row]));
});

/** Record the outcome of an Easy Split vendor registration attempt. */
exports.updateOndcSellerVendor = asyncHandler(async ({
  id,
  cashfreeVendorId,
  cashfreeVendorStatus,
  lastSyncError = null,
}) => {
  if (!id) return null;
  return await ondcSellers.update(
    {
      ...(cashfreeVendorId !== undefined && { cashfreeVendorId }),
      ...(cashfreeVendorStatus !== undefined && { cashfreeVendorStatus }),
      lastSyncError,
      vendorSyncedAt: new Date(),
    },
    { where: { id } }
  );
});
