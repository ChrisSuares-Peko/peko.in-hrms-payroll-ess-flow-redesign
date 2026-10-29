import { useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/hooks';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import VerifyingOverlay from './checkout/VerifyingOverlay';
import UnavailableItemsModal from './modals/UnavailableItemsModal';
import { validateCartApi } from '../api/cart';
import { useBuyNowScope } from '../hooks/useBuyNowScope';
import { getPosition } from '../hooks/useCurrentLocation';
import { useUnavailableItemsModal } from '../hooks/useUnavailableItemsModal';
import { setValidation } from '../slices/cartSlice';
import { AddressField } from '../types/address';
import { CartItem } from '../types/cartTypes';
import { formatInr } from '../utils/priceInr';
import { getValidatedSummary, isQuoteValidated } from '../utils/quoteSummary';
import { fromFailedGroups, fromStockItems } from '../utils/unavailableCartItems';

const { Text } = Typography;

type OrderSummaryProps =
    | { mode: 'cart' }
    | {
          mode: 'checkout';
          formRef: React.MutableRefObject<any>;
          /** delivery address picked in DeliveryDetails — its zipCode drives the seller validation */
          address?: AddressField;
          /** items actually being checked out — narrower than the cart under Buy Now */
          items?: CartItem[];
      };

const isCheckoutMode = (
    p: OrderSummaryProps
): p is Extract<OrderSummaryProps, { mode: 'checkout' }> => p.mode === 'checkout';

const Row = ({ label, value, valueClass = 'text-[#252430]' }: {
    label: string;
    value: string;
    valueClass?: string;
}) => (
    <Flex align="start" justify="space-between" gap={12} className="w-full">
        <Text className="min-w-0 text-[16px] tracking-[-0.3px] text-[#4a5565]">{label}</Text>
        <Text className={`shrink-0 whitespace-nowrap text-[16px] ${valueClass}`}>{value}</Text>
    </Flex>
);

/**
 * Order summary panel (Figma 2304-27306 / 2342-24561): totals, savings, and
 * the checkout CTA — shared by the cart page (`mode="cart"`, just navigates
 * to the checkout page) and the checkout page (`mode="checkout"`, which walks
 * the buyer through the two ONDC seller round-trips).
 *
 * Checkout is two deliberate steps, not one button:
 *
 *   1. "Ship to this address" fires /select. Failed seller groups open a confirm-to-remove
 *      modal instead of continuing with a mixed quote.
 *   2. "Proceed to payment" submits the delivery form, which fires /init and
 *      hands off to the shared payment screen.
 *
 * They used to be chained behind a single click. Two protocol actions taken on
 * the buyer's behalf from one gesture meant nobody ever saw the seller's quote
 * before committing to it, a ~60s dead button covered both round-trips with no
 * way to tell which one was slow or which one failed, and a retry after an /init
 * failure silently re-fired /select as well.
 */
const OrderSummary = (props: OrderSummaryProps) => {
    const { mode } = props;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const cartDetails = useAppSelector(state => state.reducer.cart);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { ondcProductIds } = useBuyNowScope();
    // 'select' = validating the cart with the sellers, 'init' = the delivery-form
    // submit running the ONDC init before the shared payment screen takes over.
    const [phase, setPhase] = useState<'select' | 'init' | null>(null);
    const {
        unavailableOpen,
        unavailableItems,
        promptUnavailable,
        dismissUnavailable,
        confirmUnavailable,
        confirmingUnavailable,
    } = useUnavailableItemsModal();

    // The seller quote from step 1. Cleared by cartSlice.setData on any cart
    // change and by DeliveryDetails when the delivery address changes, so step 2
    // can never run against a quote priced for something else.
    const validation = cartDetails?.validation;
    // Shared with DeliveryDetails, so the CTA and the delivery card always agree
    // on which step of checkout the buyer is on.
    const isValidated = isQuoteValidated(validation);

    // Under Buy Now only one product is being bought, so the money shown here has
    // to come from that item — not from the server's whole-cart totals. When no
    // scope is passed this list IS the cart, so the numbers are unchanged.
    let itemsFromProps: CartItem[] | undefined;
    if (isCheckoutMode(props)) {
        const { items } = props;
        itemsFromProps = items;
    }
    const scopedItems: CartItem[] = itemsFromProps || cartDetails?.items || [];
    const isScoped = scopedItems.length !== (cartDetails?.items?.length ?? 0);
    const availableItems = scopedItems.filter(item => item.available);

    const scopedItemsTotal = availableItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const scopedCount = isScoped
        ? availableItems.reduce((sum, item) => sum + (item.productQuantity || 0), 0)
        : cartDetails?.count || 0;
    const itemsTotalAmount = isScoped ? scopedItemsTotal : cartDetails?.itemsTotalAmount || 0;
    const totalGst = cartDetails?.totalGst || 0;
    const cartShipping = cartDetails?.shippingCharge || 0;
    const cartGrandTotal = isScoped
        ? parseFloat((scopedItemsTotal + cartShipping).toFixed(2))
        : cartDetails?.grandTotal || 0;

    const sellerSummary = isValidated
        ? getValidatedSummary(validation?.groups, validation?.validatedTotal)
        : null;
    const shipping = sellerSummary ? sellerSummary.shipping : cartShipping;
    const grandTotal = sellerSummary ? sellerSummary.total : cartGrandTotal;

    const totalSavings = availableItems.reduce(
        (sum, item) =>
            sum +
            (item.maxPrice > item.price
                ? (item.maxPrice - item.price) * item.productQuantity
                : 0),
        0
    );

    // The server-side cart discount applies to the whole cart, so it can't be
    // attributed to a scoped subset — fall back to the subset's own savings.
    const discount = (isScoped ? totalSavings : cartDetails?.discount || totalSavings) || 0;

    const totalMaxPrice = availableItems.reduce(
        (sum, item) => sum + item.maxPrice * item.productQuantity,
        0
    );

    const subTotal = sellerSummary
        ? sellerSummary.itemsTotal
        : (discount > 0 ? totalMaxPrice : itemsTotalAmount) - totalGst;

    /**
     * Step 1 — ONDC /select. Fires one per seller group on the backend (each held
     * until that seller's on_select quote arrives, up to ~30s) and parks the
     * result in redux, which is what step 2 reads. Any failed seller group
     * blocks checkout until those items are removed (or the buyer dismisses
     * the confirm modal and stays here).
     */
    const validateWithSeller = async () => {
        if (!isCheckoutMode(props)) return;
        const { formRef, address } = props;

        // Surface delivery-form errors (incl. the pincode field) BEFORE the
        // seller round-trip — validating with sellers can take up to ~30s.
        const form = formRef.current;
        const formErrors = form ? await form.validateForm() : { form: 'missing' };
        if (Object.keys(formErrors).length > 0) {
            form?.handleSubmit(); // marks fields touched so the errors render
            dispatch(
                showToast({
                    description: 'Please complete the delivery details to continue',
                    variant: 'error',
                })
            );
            return;
        }

        const pincode = String(form.values?.pincode || address?.zipCode || '').trim();
        if (!/^[1-9][0-9]{5}$/.test(pincode)) {
            dispatch(
                showToast({
                    description: 'Please enter a valid 6-digit delivery pincode',
                    variant: 'error',
                })
            );
            return;
        }

        setPhase('select');
        try {
            // best-effort browser location — gps is optional, omitted when unavailable
            const pos = await getPosition();
            const gps = pos ? `${pos.coords.latitude},${pos.coords.longitude}` : undefined;

            const result = await validateCartApi({
                userId: id,
                userType: role,
                pincode,
                gps,
                // Buy Now: validate only this product. useForm passes the same
                // scope to /init — both re-derive their groups from the cart.
                ondcProductIds,
            });

            // A group can come back "validated" (fulfillment serviceable) yet still
            // carry no real price if the seller's on_select response was incomplete
            // — treat that the same as an all-sellers failure rather than silently
            // continuing to checkout with a ₹0 total.
            if (!result) return;

            const failedRows = fromFailedGroups(result.groups, scopedItems);
            const hasFailedGroups = (result.groups || []).some(group => group.status === 'failed');
            if (failedRows.length) {
                dispatch(setValidation(null));
                promptUnavailable(failedRows);
                return;
            }

            if (hasFailedGroups || !result.anyValidated || result.validatedTotal <= 0) {
                dispatch(setValidation(null));
                dispatch(
                    showToast({
                        description:
                            'Could not validate your cart with the sellers. Please try again.',
                        variant: 'error',
                    })
                );
                return;
            }

            dispatch(setValidation(result));

            const quoteSummary = getValidatedSummary(result.groups, result.validatedTotal);
            const serviceDetails = {
                cart_total_value: result.validatedTotal,
                cart_item_count: scopedCount,
                cart_shipping_fee: quoteSummary.shipping,
            };
            sessionStorage.setItem('service_details', JSON.stringify({ serviceDetails }));
        } finally {
            setPhase(null);
        }
    };

    /**
     * Step 2 — ONDC /init, via the delivery form's own submit handler (useForm's
     * handleSubmission), which reuses the transaction ids step 1 established so
     * the seller sees one continuous order session, then hands the bill to the
     * shared /payments screen.
     *
     * submitForm (not handleSubmit) so this can be awaited — the button has to
     * stay busy for the whole second seller round-trip.
     */
    const proceedToPayment = async () => {
        if (!isCheckoutMode(props)) return;
        const { formRef } = props;
        if (!formRef.current) return;

        setPhase('init');
        try {
            await formRef.current.submitForm();
        } finally {
            setPhase(null);
        }
    };

    const isBusy = isCheckoutMode(props) && phase !== null;
    // On checkout the button advances one step at a time; on the cart page it is
    // still just a link to checkout.
    const goToCheckout = () =>
        navigate(`${paths.dashboard.officeSupplies}/${paths.officeSupplies.checkout}`);

    let handleProceed;
    if (isCheckoutMode(props)) {
        if (isValidated) {
            handleProceed = proceedToPayment;
        } else {
            handleProceed = validateWithSeller;
        }
    } else {
        handleProceed = () => {
            const stockGone = fromStockItems(scopedItems);
            if (stockGone.length) {
                promptUnavailable(stockGone, goToCheckout);
                return;
            }
            goToCheckout();
        };
    }

    const checkoutCta = () => {
        // Step 1's progress is carried by VerifyingOverlay, so the label stays put
        // and the button just spins. Step 2 has no overlay — the label is its only
        // progress signal.
        if (phase === 'init') return 'Confirming with seller…';
        return isValidated ? 'Pay Now' : 'Ship to this address';
    };

    return (
        <Flex
            vertical
            gap={25}
            className="w-full rounded-3xl bg-white p-[30px] drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]"
        >
            <Text className="text-[18px] font-semibold leading-[26px] text-[#101828]">
                Order summary
            </Text>

            <Flex vertical gap={15} className="w-full">
                <Row label="Sub-total" value={formatInr(subTotal)} />
                {!sellerSummary && discount > 0 && (
                    <Row
                        label="Discount"
                        value={`-\u00A0${formatInr(discount)}`}
                        valueClass="text-[#43b75d]"
                    />
                )}
                {!sellerSummary && <Row label="GST (incl.)" value={formatInr(totalGst)} />}
                <Row
                    label="Total Shipping"
                    value={
                        sellerSummary || !cartDetails.freeDelivery
                            ? formatInr(shipping)
                            : formatInr(0)
                    }
                />
                {sellerSummary?.otherCharges.map(row => (
                    <Row
                        key={row.label}
                        label={row.label}
                        value={
                            row.amount < 0
                                ? `-\u00A0${formatInr(Math.abs(row.amount))}`
                                : formatInr(row.amount)
                        }
                        valueClass={row.amount < 0 ? 'text-[#43b75d]' : 'text-[#252430]'}
                    />
                ))}

                <div className="h-px w-full bg-[#e4e4e7]" />

                <Flex align="start" justify="space-between" gap={12} className="w-full">
                    <Flex vertical className="min-w-0">
                        <Text className="text-[16px] font-semibold leading-6 text-[#101828]">
                            Total Amount
                        </Text>
                        <Text className="text-[12px] tracking-[-0.3px] text-[#b2b2b2]">
                            Inclusive of all taxes
                        </Text>
                    </Flex>
                    <Text className="shrink-0 whitespace-nowrap text-[16px] font-semibold leading-6 text-[#252430]">
                        {formatInr(grandTotal)}
                    </Text>
                </Flex>

                {totalSavings > 0 && (
                    <Flex
                        align="center"
                        justify="center"
                        className="w-full rounded-xl bg-[#f4fff7] px-4 py-2"
                    >
                        <Text className="whitespace-nowrap text-[14px] font-medium tracking-[0.385px] text-[#43b75d]">
                            You save {formatInr(totalSavings)}
                        </Text>
                    </Flex>
                )}
            </Flex>

            <Flex vertical gap={17} align="center" className="w-full">
                <Flex vertical gap={8} className="w-full">
                    <Button
                        type="primary"
                        danger
                        disabled={scopedCount < 1}
                        loading={isBusy}
                        onClick={handleProceed}
                        className="!h-14 !w-full !rounded-lg !text-[18px] !font-medium"
                    >
                        {isCheckoutMode(props) ? checkoutCta() : 'Proceed to checkout'}
                    </Button>
                    {mode === 'cart' && (
                        <Button
                            danger
                            onClick={() => navigate(`/${paths.officeSupplies.index}`)}
                            className="!h-14 !w-full !rounded-lg !border-lightRed !text-[18px] !font-medium !text-lightRed"
                        >
                            Continue shopping
                        </Button>
                    )}
                </Flex>
            </Flex>

            <UnavailableItemsModal
                open={unavailableOpen}
                items={unavailableItems}
                confirming={confirmingUnavailable}
                onClose={dismissUnavailable}
                onConfirm={confirmUnavailable}
            />

            <VerifyingOverlay
                open={isCheckoutMode(props) && phase === 'select'}
                message="Verifying the order with seller(s)"
            />
        </Flex>
    );
};

export default OrderSummary;
