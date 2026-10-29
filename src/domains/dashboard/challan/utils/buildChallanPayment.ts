import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Challan } from '../types/index';

// Builds the data for the shared Review/Payment Summary screen (setPaymentData).
// Pricing: challan_price = the challan fine (fetched `amount`); convenience_fee = Peko surcharge
// (passed in, computed once on the total); discount = 0 for now;
// selling_price = challan_price + convenience_fee − discount; total = Σ selling_price.
// The BE is the source of truth for pricing — it recomputes the fee and builds the Droom
// Push Order `items` map (with company_token + user_id). We only send the selected challans.
export const buildChallanPayment = (challans: Challan[], convenienceFee = 0) => {
    const challanTotal = challans.reduce((sum, c) => sum + (c.challan_price ?? c.amount), 0);
    const discount = 0;
    const totalAmount = challanTotal + convenienceFee - discount;

    // Row label = offence (reason) with the challan number beneath; fall back to the number.
    const billSummary = challans.map(c => {
        const reason = c.offense_details?.trim();
        return {
            key: reason || c.challan_number,
            subText: reason ? c.challan_number : undefined,
            value: `₹ ${formatNumberWithLocalString(c.challan_price ?? c.amount)}`,
        };
    });

    const paymentSummary = [
        { key: 'Challan Total', value: `₹ ${formatNumberWithLocalString(challanTotal)}` },
        // <Summary/> prefixes '₹ ' for 'Convenience Fee', so keep this value bare.
        { key: 'Convenience Fee', value: formatNumberWithLocalString(convenienceFee) },
    ];

    const payload = {
        // accessKey drives the shared payment screen's payment-methods lookup
        // (fetchAvailablePgMethods) + surcharge — without it, payment options render empty.
        accessKey: accessKeys.challan,
        reg_num: challans[0]?.registration_number,
        challans: challans.map(c => ({
            challan_number: c.challan_number,
            challan_price: c.challan_price ?? c.amount,
            registration_number: c.registration_number,
        })),
    };

    return { billSummary, paymentSummary, totalAmount, payload };
};
