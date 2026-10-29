import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString, roundMoney } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';

export default function useDomainHostingCheckout() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const { customerId, cartData } = useAppSelector(state => state.reducer.domainHosting);

    const [loading, setLoading] = useState(false);

    const handleProceedToPayment = useCallback(
        async (assignedDomain: string | null) => {
            const getEventPrefix = () => {
                if (!cartData) return 'domain';
                const primaryItem = cartData.items.find(i => i.itemType !== 'domain');
                const prefixMap: Record<string, string> = {
                    vps_server: 'vps',
                    backup: 'vps',
                    shared_hosting: 'hosting',
                    titan_email: 'titan',
                    google_workspace: 'google_workspace',
                };
                return primaryItem ? (prefixMap[primaryItem.itemType] ?? 'domain') : 'domain';
            };
            if (!cartData || !customerId) {
                dispatch(
                    showToast({ description: 'Cart or customer data missing. Please try again.', variant: 'error' })
                );
                return;
            }

            setLoading(true);

            // Validate cart amount consistency between individual items and backend total
            const cartCalculatedTotal = cartData.items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0);
            if (Math.abs(cartCalculatedTotal - (cartData.itemsTotalAmount ?? 0)) > 0.01) {
                console.warn('[Domain & Hosting Checkout] Amount mismatch detected', {
                    cartCalculated: cartCalculatedTotal,
                    backendItemsTotal: cartData.itemsTotalAmount,
                    difference: cartCalculatedTotal - (cartData.itemsTotalAmount ?? 0)
                });
            }

            // Paise-rounded base so GET /surcharge and validateAmount use the same order amount as the backend cart total
            const itemsTotal = roundMoney(cartData.itemsTotalAmount ?? 0);

            // Fetch surcharge from backend to display to user
            // Note: Backend will recalculate surcharge during payment processing
            // Both frontend and backend use the same base amount (itemsTotal) without surcharge
            const surchargeData = await getSurcharge({
                userId: id,
                userType: role,
                amount: itemsTotal,
                accessKey: accessKeys.domainAndHosting,
            });
            const surchargeAmount =
                surchargeData && 'surcharge' in surchargeData
                    ? roundMoney(parseFloat(String(surchargeData.surcharge)))
                    : 0;

            // Payable total includes platform fee; bill summary "Total" matches cart order amount (excl. surcharge)
            const total = roundMoney(itemsTotal + surchargeAmount);

            const billSummary = [
                { key: 'Service name', value: 'Domain & Hosting' },
                { key: 'Items', value: String(cartData.count) },
                { key: 'Total', value: `₹ ${formatNumberWithLocalString(itemsTotal)}` },
            ];

            const paymentSummary: { key: string; value: string }[] = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(surchargeAmount)}`,
                },
            ];

            // Build domainDetails from cart domain items
            const domainDetails: Record<string, { years: number }> = cartData.items
                .filter((item) => item.itemType === 'domain')
                .reduce(
                    (acc, item) => ({ ...acc, [item.productName]: { years: item.productQuantity } }),
                    {} as Record<string, { years: number }>
                );

            // Include assigned domain for hosting packages if not already in cart domains
            if (assignedDomain && !domainDetails[assignedDomain]) {
                domainDetails[assignedDomain] = { years: 1 };
            }

            const requestBody = {
                accessKey: accessKeys.domainAndHosting,
                amount: itemsTotal,
                customerId,
                cartId: cartData.cartId,
                pocName: user?.contactPersonName ?? '',
                email: user?.email ?? '',
                payCashback: false,
                invoiceOption: 'NoInvoice',
                autoRenew: false,
                domainDetails,
                userId: id,
                userType: role,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'officeAndBusiness/domain-and-hosting/payment',
                })
            );

            if (typeof Moengage?.track_event === 'function') {
                const domainNames = cartData.items
                    .filter(i => i.itemType === 'domain')
                    .map(i => i.productName)
                    .filter(Boolean);
                Moengage.track_event(`${getEventPrefix()}_order_processing`, {
                    domain_name: domainNames.length === 1 ? domainNames[0] : domainNames,
                    total_price: total,
                });
            }
            sessionStorage.setItem(
                'service_details',
                JSON.stringify({
                    serviceDetails: { total_amount: total, moengage_prefix: getEventPrefix() },
                })
            );

            setLoading(false);
            navigate(paths.dashboard.payments);
        },
        [cartData, customerId, id, role, user, dispatch, navigate]
    );

    return { handleProceedToPayment, loading };
}
