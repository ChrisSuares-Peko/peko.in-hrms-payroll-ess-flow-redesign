const businessRegistrationCatalog = require("../entities/businessRegistrationCatalog");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

exports.findByVendorKey = async (vendorCatalogId, credentialId) => {
    const catalogRow = await businessRegistrationCatalog.findOne({
        where: { vendorCatalogId },
        raw: true,
    });
    await applyCommissionMarkup(catalogRow, ["amount", "vendorPrice"], credentialId);
    return catalogRow;
};
