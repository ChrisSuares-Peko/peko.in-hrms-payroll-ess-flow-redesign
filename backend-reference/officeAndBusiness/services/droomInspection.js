// Droom eco-order proxy — books the doorstep technician visit behind the Inspection
// product. Endpoint is SINGULAR (`enterprise-eco-order`; the plural 404s). Success
// returns { code: 'success', data: { order_id }, message }. Status updates arrive on
// our inspection webhook — Droom provides no order-status API for this account.
// `field_person`/`field_contact` are Droom-populated on confirmation, never sent.
const { postDroomForm } = require('./droomClient');

const ECO_ORDER_PATH = '/dss/enterprise-eco-order';

// Maps Peko's camelCase booking onto Droom's snake_case form fields and nothing else —
// validation, slot joining and the client identity are all the controller's job (see
// controllers/corporate/carReportInspection.js).
exports.bookInspection = async (
    {
        proposalNumber,
        make,
        model,
        year,
        trim,
        customerName,
        customerEmail,
        customerAddress,
        customerCity,
        customerState,
        customerPincode,
        customerPhone,
        slot1,
        slot2,
        registrationNumber,
        clientName,
        clientSpocName,
        clientSpocMobile,
        clientSpocEmail,
        inspectionCityName,
        vehicleType,
        productCode,
    },
    logTraceId = null
) =>
    postDroomForm(
        ECO_ORDER_PATH,
        {
            // Peko-generated reference. We use the corporateTxnId, matching how the
            // challan product mints its `reference_id`.
            proposal_number: proposalNumber,
            make,
            model,
            year,
            trim,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_address: customerAddress,
            customer_city: customerCity,
            customer_state: customerState,
            customer_pincode: customerPincode,
            customer_phone: customerPhone,
            // Combined `YYYY-MM-DD HH:mm:ss`, joined by utils/carReport.js joinDroomSlot.
            slot1,
            slot2,
            registration_number: registrationNumber,
            // Peko's own corporate identity as the booking client, distinct from the
            // customer_* fields above.
            client_name: clientName,
            client_spoc_name: clientSpocName,
            client_spoc_mobile: clientSpocMobile,
            client_spoc_email: clientSpocEmail,
            inspection_cityname: inspectionCityName,
            vehicle_type: vehicleType,
            // Droom's product for the chosen package (INSPECTION_PRODUCT_CODES).
            product_code: productCode,
        },
        logTraceId
    );
