import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { setPaymentData } from '@domains/dashboard/payments/slices/payment';
import { formatTaxLabel } from '@domains/dashboard/plans/utils';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import {
    IssuePhysicalCardByAdminPayload,
    preflightPhysicalCardOrder,
} from '../../api/admin/issueCardApi';
import { getPhysicalCardPricing } from '../../api/admin/physicalCardPricingApi';

interface StartPurchaseArgs {
    cardIssuanceId: string;
    holderName: string;
    delivery?: IssuePhysicalCardByAdminPayload;
    cardRequestId?: number;
}

const CARDS_PATH = `/${paths.dashboard.corporateCard}`;

const GENERIC_ERROR =
    'Something went wrong. If the issue persists, please contact support at reach@peko.one';

const rupees = (value: number) => `₹ ${formatNumberWithLocalString(value)}`;

/**
 * Hands an unpaid physical card off to the shared /payments screen.
 *
 * Priced like a plan purchase: the server returns the pre-GST base, the GST and the total, and those exact
 * numbers are what the screen shows and what the order sends — nothing is computed here.
 *
 * The delivery details ride inside the payload because paymentGateway persists the whole body and replays
 * it to its fulfilment handler — that is what carries the address across the Cashfree round trip.
 */
export const usePhysicalCardPurchase = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isPreparing, setIsPreparing] = useState(false);

    const startPurchase = async ({
        cardIssuanceId,
        holderName,
        delivery,
        cardRequestId,
    }: StartPurchaseArgs) => {
        setIsPreparing(true);

        const preflight = await preflightPhysicalCardOrder(role, id, {
            cardIssuanceId,
            ...(cardRequestId ? { cardRequestId } : {}),
        });
        if (!preflight || !preflight.ok) {
            setIsPreparing(false);
            dispatch(
                showToast({
                    variant: 'error',
                    description: preflight?.message || GENERIC_ERROR,
                })
            );
            return false;
        }

        const pricing = await getPhysicalCardPricing(role, id);
        setIsPreparing(false);

        // The server validates the total before the order, so an unpriced card cannot be paid for.
        if (!pricing) {
            dispatch(showToast({ variant: 'error', description: GENERIC_ERROR }));
            return false;
        }

        dispatch(
            setPaymentData({
                title: 'Bill Summary',
                billSummary: [
                    { key: 'Service name', value: 'Physical Card' },
                    { key: 'Cardholder', value: holderName },
                ],
                paymentSummary: [
                    { key: 'Subtotal', value: rupees(pricing.taxableAmount) },
                    ...(pricing.taxAmount > 0
                        ? [{ key: formatTaxLabel(pricing.taxRate), value: rupees(pricing.taxAmount) }]
                        : []),
                ],
                totalAmount: pricing.expectedPaymentAmount,
                earningCashbackAmount: 0,
                payload: {
                    accessKey: accessKeys.corporateCards,
                    amount: pricing.taxableAmount,
                    pgAmount: pricing.expectedPaymentAmount,
                    quantity: pricing.quantity,
                    cardIssuanceId,
                    ...(cardRequestId ? { cardRequestId } : {}),
                    ...(delivery ? { shipping: delivery } : {}),
                    transactionId: new Date().valueOf(),
                    currentUrl: window.location.href,
                    // Cashfree only — an extra physical card is not payable from the wallet.
                    isCashfreeOnly: true,
                },
                url: null,
                navigatePath: CARDS_PATH,
            })
        );

        navigate(paths.dashboard.payments);
        return true;
    };

    return { startPurchase, isPreparing };
};
