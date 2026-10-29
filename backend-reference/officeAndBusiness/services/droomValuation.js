// Droom OBV used-price range — the on-screen Fair Market Value bands on a valuation
// order. Field reference: OBV_History_API_Doc (Jul'26).
const { postDroomForm } = require('./droomClient');

const OBV_PATH = '/dss/enterprise-used-price-range';

// Channel id from the older samples; sent only when configured.
const SOURCE = process.env.DROOM_OBV_SOURCE || '';

exports.getUsedPriceRange = async (
    { make, model, year, trim, customerType, transactionType, kmsDriven, city, noOfOwners },
    logTraceId = null
) =>
    postDroomForm(
        OBV_PATH,
        {
            make,
            model,
            year,
            trim,
            customer_type: customerType,
            transaction_type: transactionType,
            source: SOURCE,
            kms_driven: kmsDriven,
            city,
            noOfOwners,
        },
        logTraceId
    );
