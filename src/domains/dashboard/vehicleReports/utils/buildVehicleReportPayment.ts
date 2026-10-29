import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import { reportMeta } from './reportMeta';
import { vehicleHeadline } from './vehicleLabel';
import { VehicleReportPaymentArgs } from '../types/index';

// Builds the data for the shared Review/Payment screen (setPaymentData).
// Pricing: report_price = the catalogue price for the chosen report or inspection
// package; convenience_fee = Peko surcharge, computed once on the report price.
// The BE remains the source of truth for pricing — we send the selection only.
export const buildVehicleReportPayment = (
    args: VehicleReportPaymentArgs,
    convenienceFee = 0
) => {
    const { reportType, vehicle, reportPrice, packageName, packageId, formValues } = args;
    const lineItem = packageName ?? reportMeta[reportType].title;
    // Only the history and inspection forms collect a registration number; the valuation
    // form does not, hence the cast rather than a field on the union.
    const { registrationNumber } = formValues as { registrationNumber?: string };
    // Report prices are whole rupees; the surcharge can be fractional. The
    // "without decimal point" formatter keeps decimals only when they exist, so
    // ₹199 stays ₹199 while a ₹11.80 fee keeps its paise.
    const money = formatNumberWithLocalStringWithoutDecimalPoint;

    return {
        // Report/package row, then the vehicle as its own labelled row (bug 30151, per
        // design) — the plate when there is one, otherwise the make/model headline.
        billSummary: [
            {
                key: lineItem,
                value: `₹ ${money(reportPrice)}`,
            },
            {
                key: 'Vehicle Reg.No',
                value: vehicle.vehicleNumber || registrationNumber || vehicleHeadline(vehicle),
            },
        ],
        paymentSummary: [
            // <Summary/> only auto-prefixes '₹ ' for 'Amount' and 'Convenience Fee',
            // so prefix 'Report Price' here and keep the fee value bare.
            { key: 'Report Price', value: `₹ ${money(reportPrice)}` },
            { key: 'Convenience Fee', value: money(convenienceFee) },
        ],
        totalAmount: reportPrice + convenienceFee,
        payload: {
            // accessKey drives the shared payment screen's payment-methods lookup
            // (fetchAvailablePgMethods) + surcharge — without it, payment options
            // render empty.
            accessKey: accessKeys.vehicleReports,
            reportType,
            reportName: lineItem,
            // A manually entered vehicle has no fleet registration number. Valuation is
            // priced from the spec so it can go without, but for history the plate IS the
            // input — fall back to the one the form collected.
            reg_num: vehicle.vehicleNumber || registrationNumber,
            vehicle: {
                make: vehicle.manufacturer,
                model: vehicle.model,
                variant: vehicle.variant,
                bodyType: vehicle.bodyType,
                isManual: !!vehicle.isManual,
            },
            // Inspection only — what the backend prices from. reportName carries the
            // display name, which must never be what we charge against.
            ...(packageId ? { packageId } : {}),
            ...formValues,
        },
    };
};
