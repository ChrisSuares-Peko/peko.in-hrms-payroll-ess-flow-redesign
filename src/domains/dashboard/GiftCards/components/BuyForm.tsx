import { useEffect, useRef, useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Form, Typography, Button, Flex, message, Radio } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { accessKeys } from '@utils/accessKeys';

import AmountField from './AmountField';
import BuyOrderSummary from './BuyOrderSummary';
import { BulkPurchaseIcon, EmployeesIcon, FriendIcon, SelfIcon } from './OrderTypeIcons';
import QuantityField from './QuantityField';
import {
    resetFormData,
    resetsetAddressData,
    setBuyAgain,
    setFormData,
    setProductData,
    setResuming,
} from '../slices/checkoutSlice';
import { GiftCardOrderTypes } from '../types/employee';
import { GiftCardDetailResponse } from '../types/types';

interface BuyFormProps {
    productData?: GiftCardDetailResponse;
    onContinue?: () => void;
    collapsed: boolean;
    onToggle: (collapsed: boolean) => void;
    // Reported up so ReceiverDetailsCard's Buy Now can require the amount to be
    // (re-)confirmed via Continue — expanding/collapsing this card on its own
    // does NOT invalidate the confirmation, only actually editing the amount does.
    onAmountConfirmedChange?: (confirmed: boolean) => void;
}

const BuyForm: React.FC<BuyFormProps> = ({
    productData,
    onContinue,
    collapsed,
    onToggle,
    onAmountConfirmedChange,
}: BuyFormProps) => {
    const dispatch = useAppDispatch();
    const isPurchasedPayroll = useServiceAccess(accessKeys.payroll);

    const id = productData?.mainGiftCard.id;

    // formDetails/productDetails/addressDetails in redux already belong to *this*
    // product whenever the user is resuming an in-progress purchase — either via an
    // explicit "Buy Again" click (order history, isBuyAgain), or by navigating back
    // from the payment page before completing it (isResuming, set by usePayment right
    // before it navigates there). Both should restore the selection instead of
    // starting blank; id alone can't tell "resuming" apart from "the user picked this
    // same product again from a listing page" (which should start fresh), so it's
    // compared together with a still-present amount.
    const {
        formDetails: prefillFormDetails,
        productDetails: prefillProductDetails,
        isBuyAgain,
        isResuming,
    } = useAppSelector(state => state.reducer.giftcardCheckout);
    // Compared as strings — the order-history record's id round-trips through a
    // stored/parsed JSON payload and isn't reliably the same number type as the
    // product API's numeric id.
    const hasMatchingPrefill =
        (isBuyAgain || isResuming) &&
        Boolean(id) &&
        String(prefillProductDetails.id) === String(id) &&
        Boolean(prefillFormDetails.amount);

    // Guard against "Buy for Employees" prefilling in from a past purchase made
    // while payroll access was active — if that access has since lapsed, the
    // radio option is hidden below and this would otherwise leave nothing selected.
    const prefillOrderType =
        hasMatchingPrefill &&
        (prefillFormDetails.orderType !== GiftCardOrderTypes.BUYFOREMPLOYEE || isPurchasedPayroll)
            ? prefillFormDetails.orderType
            : GiftCardOrderTypes.BUYFOROTHER;

    const [orderType, setOrderType] = useState<GiftCardOrderTypes>(prefillOrderType);

    // Freeze the mount-time prefill decision so the reconciliation effect below (which
    // only fires once isPurchasedPayroll resolves, on a later render) judges against
    // the same snapshot this component mounted with, rather than whatever redux
    // happens to hold by then.
    const initialPrefill = useRef({ hasMatchingPrefill, orderType: prefillFormDetails.orderType });

    // isPurchasedPayroll starts out `undefined` (useServiceAccess resolves it in its
    // own effect, after this component's first render), so the prefillOrderType used
    // to seed orderType's useState above can race it: a genuine "Buy Again" of a "Buy
    // for Employees" order looks like lapsed payroll access on that first render and
    // silently falls back to buyForOther — and being a useState initializer, it never
    // gets a second chance. Reconcile once isPurchasedPayroll actually resolves.
    const orderTypeReconciled = useRef(false);
    useEffect(() => {
        if (orderTypeReconciled.current || isPurchasedPayroll === undefined) return;
        orderTypeReconciled.current = true;
        if (
            initialPrefill.current.hasMatchingPrefill &&
            initialPrefill.current.orderType === GiftCardOrderTypes.BUYFOREMPLOYEE &&
            isPurchasedPayroll
        ) {
            setOrderType(GiftCardOrderTypes.BUYFOREMPLOYEE);
            dispatch(setFormData({ orderType: GiftCardOrderTypes.BUYFOREMPLOYEE }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPurchasedPayroll]);

    // The Continue submit below unconditionally clears addressDetails (see comment
    // there) — when resuming a matched in-progress session (Buy Again, or simply
    // navigating back from the payment page) that would wipe out the just-restored
    // receiver/employee data before ReceiverDetailsCard/CheckoutForm ever get to use
    // it. Skip that clear exactly once, for the very first Continue click of a
    // matched session; any later Continue (after the user's gone back and actually
    // changed the amount) clears normally again.
    const hasSkippedInitialAddressReset = useRef(false);

    // Only an actual edit to the amount unconfirms it — expanding the card to
    // just look at it, or re-collapsing without changing anything, doesn't.
    const setAmountConfirmed = (confirmed: boolean) => {
        onAmountConfirmedChange?.(confirmed);
    };

    const product_name = productData?.mainGiftCard?.product_name;

    const product_id = productData?.mainGiftCard.product_id;
    const product_image = productData?.mainGiftCard.image;
    const denominations = productData?.mainGiftCard.denominations;
    const min_price = productData?.mainGiftCard.min_price;
    const max_price = productData?.mainGiftCard.max_price;
     const priceType = productData?.mainGiftCard?.priceType;
    const accessKey = productData?.mainGiftCard.serviceOperator?.accessKey;
    const serviceOperatorId = productData?.mainGiftCard.serviceOperatorId;
    const quantityLimit = accessKey === 'xoxoday' ? productData?.mainGiftCard.quantityLimit : undefined;

    useEffect(() => {
        const product = { product_name, id, product_image, product_id, accessKey: accessKey ?? '', serviceOperatorId };

        dispatch(setProductData(product));
    }, [dispatch, product_name, id, product_image, product_id, accessKey, serviceOperatorId]);

    // Clear any leftover receiver details AND amount/orderType from a previous
    // purchase (of a *different* gift card) — otherwise ReceiverDetailsCard's
    // Buy Now could submit using a stale amount that was never entered/validated
    // for *this* product. Skipped whenever the redux data already matches *this*
    // product (hasMatchingPrefill) — a genuine "Buy Again", or simply resuming an
    // in-progress purchase after navigating away (e.g. to the payment page) and back.
    useEffect(() => {
        if (!hasMatchingPrefill) {
            dispatch(resetsetAddressData());
            dispatch(resetFormData());
        }
        // isBuyAgain/isResuming are one-shot flags — consume them now so simply
        // revisiting this same product's page again later (without another explicit
        // Buy Again click or Buy Now submit) doesn't keep re-triggering the prefill.
        if (isBuyAgain) {
            dispatch(setBuyAgain(false));
        }
        if (isResuming) {
            dispatch(setResuming(false));
        }
        // Only ever run once, on this BuyForm instance's mount (it fully
        // remounts per product via Details.tsx's key={id}).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validateAmount = (val: number): boolean | undefined => {
        const minSellingPrice = Number(min_price) || 0;
        const maxSellingPrice = Number(max_price) || Number.MAX_SAFE_INTEGER;

        // Check if the value is within the min and max prices
        if (val < minSellingPrice || val > maxSellingPrice) {
            message.error('Value must be within the minimum and maximum price range');
            return false;
        }

        // Check if the value is one of the denominations
        if (priceType === 'FIXED') {
            const numericVal = Number(val);
            if (denominations && denominations.length > 0 && !denominations.includes(numericVal)) {
                message.error('Please select a valid amount:');
                return false;
            }
        }
        return true;
    };

    return (
        <Formik
            initialValues={
                hasMatchingPrefill
                    ? {
                          amount: prefillFormDetails.amount,
                          // A prior non-bulk purchase of this product leaves quantity at '1' —
                          // don't let that leak in as a sub-minimum bulk quantity here.
                          quantity: String(Math.max(parseInt(prefillFormDetails.quantity, 10) || 2, 2)),
                      }
                    : { amount: '', quantity: '2' }
            }
            onSubmit={(values, { setSubmitting }) => {
                const isValidAmount = validateAmount(Number(values.amount));
                values.quantity =
                    orderType === GiftCardOrderTypes.BULKPURCHASE
                        ? String(Math.max(parseInt(values.quantity, 10) || 2, 2))
                        : '1';
                if (isValidAmount) {
                    dispatch(setFormData({ ...values, orderType }));
                    const skipReset =
                        initialPrefill.current.hasMatchingPrefill &&
                        !hasSkippedInitialAddressReset.current;
                    if (!skipReset) {
                        dispatch(resetsetAddressData());
                    }
                    hasSkippedInitialAddressReset.current = true;
                    onToggle(true);
                          if (typeof Moengage?.track_event === 'function') {
                        Moengage.track_event('giftcard_buy_now', {
                            brand_name: product_name,
                            amount: parseFloat(values.amount),
                            mode: orderType,
                            quantity: values.quantity,
                        });
                    }
                    setAmountConfirmed(true);
                    onContinue?.();
                }

                setSubmitting(false);
            }}
            validateOnChange // Prevent validation on change
            validateOnBlur={false} // Prevent validation on blur
        >
            {({ handleSubmit, setFieldValue, setFieldError, values }) =>
                collapsed ? (
                    <BuyOrderSummary
                        orderType={orderType}
                        amount={String(
                            (Number(values.amount) || 0) *
                                (orderType === GiftCardOrderTypes.BULKPURCHASE
                                    ? parseInt(values.quantity, 10) || 1
                                    : 1)
                        )}
                        onEdit={() => onToggle(false)}
                    />
                ) : (
                <Form onFinish={handleSubmit} layout="vertical" className="w-full">
                    <Content className="bg-white border border-[#f4f4f4] rounded-[2rem] shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)] p-5 md:p-8">
                        <Flex
                            justify="space-between"
                            align="center"
                            className="cursor-pointer"
                            onClick={() => onToggle(true)}
                        >
                             <Typography.Title level={4} style={{ margin: 0 }}>
                                                Buy <span>{productData?.mainGiftCard.product_name}</span>
                                            </Typography.Title>
                           
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brandSurface text-brandPrimary rotate-90">
                                <RightOutlined className="text-xs" />
                            </span>
                        </Flex>
                        <Flex className="mt-3">
                            <Radio.Group
                                onChange={e => {
                                    setOrderType(e.target.value);
                                    setFieldError('amount', ''); // updateTripData('orderType', e.target.value);
                                    // Live-update redux so ReceiverDetailsCard's fields (pre-fill for
                                    // Self, employee picker vs. name/email fields, etc.) react to the
                                    // order type as soon as it's picked, not only after Continue.
                                    dispatch(setFormData({ orderType: e.target.value }));
                                }}
                                buttonStyle="outline"
                                value={orderType}
                                defaultValue="buyForOther"
                                className="giftcard-order-type-group"
                            >
                                <Radio.Button value={GiftCardOrderTypes.BUYFORSELF}>
                                    <span className="giftcard-order-type-icon">
                                        <SelfIcon className="w-5 h-5" />
                                    </span>
                                    Buy for Self
                                </Radio.Button>
                                <Radio.Button defaultChecked value="buyForOther">
                                    <span className="giftcard-order-type-icon">
                                        <FriendIcon className="w-5 h-5" />
                                    </span>
                                    Gift a Friend
                                </Radio.Button>
                                {isPurchasedPayroll && (
                                    <Radio.Button value="buyForEmployees">
                                        <span className="giftcard-order-type-icon">
                                            <EmployeesIcon className="w-5 h-5" />
                                        </span>
                                        Buy for Employees
                                    </Radio.Button>
                                )}
                                <Radio.Button value="bulkPurchase">
                                    <span className="giftcard-order-type-icon">
                                        <BulkPurchaseIcon className="w-5 h-5" />
                                    </span>
                                    Bulk Purchase
                                </Radio.Button>
                            </Radio.Group>
                        </Flex>

                        <Flex className="mt-5">
                            <Form.Item
                                className="-mb-1 w-full"
                                label={
                                    productData?.mainGiftCard.is_open_denominnation
                                        ? ' Amount'
                                        : ' Amount'
                                }
                            >
                                <AmountField
                                    priceType={productData?.mainGiftCard?.priceType}
                                    min_price={productData?.mainGiftCard.min_price}
                                    max_price={productData?.mainGiftCard.max_price}
                                    setFieldValue={(field, value, shouldValidate) => {
                                        if (field === 'amount') {
                                            setAmountConfirmed(false);
                                        }
                                        setFieldValue(field, value, shouldValidate);
                                    }}
                                    denominations={productData?.mainGiftCard.denominations}
                                />
                            </Form.Item>
                        </Flex>
                        <Flex className="flex-col sm:flex-row sm:items-end gap-3 mt-4">
                            <Form.Item
                                className="mb-0 sm:w-52"
                                label="No. of Cards:"
                                style={{
                                    display:
                                        orderType === GiftCardOrderTypes.BULKPURCHASE
                                            ? 'block'
                                            : 'none',
                                }}
                            >
                                <QuantityField max={quantityLimit} />
                            </Form.Item>
                            <Button
                                className="h-12 mt-2 w-full sm:w-auto sm:flex-1 rounded-xl text-base font-semibold"
                                type="primary"
                                htmlType="submit"
                                danger
                            >
                                Continue
                            </Button>
                        </Flex>
                    </Content>
                </Form>
                )
            }
        </Formik>
    );
};
export default BuyForm;
