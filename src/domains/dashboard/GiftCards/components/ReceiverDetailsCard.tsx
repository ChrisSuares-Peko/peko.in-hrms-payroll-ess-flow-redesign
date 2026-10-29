import { useEffect, useMemo, useRef, useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import CheckoutForm from './CheckoutForm';
import usePayment from '../hooks/usePayment';
import { giftCardSchema } from '../schema/index';
import { setAddressData } from '../slices/checkoutSlice';
import { SelectedEmployee } from '../types/employee';

interface ReceiverDetailsCardProps {
    collapsed: boolean;
    onToggle: (collapsed: boolean) => void;
    // True once the Buy card's own amount validation has been confirmed via
    // its Continue button (see BuyForm) — Buy Now stays disabled until then.
    amountConfirmed: boolean;
    // Current product's id — used to detect a genuine "Buy Again" prefill vs.
    // stale addressDetails leftover from a previously purchased (different)
    // gift card. See hasMatchingPrefill below.
    id?: number;
}

// Receiver Details, rendered as its own card directly on the gift card
// details page (instead of navigating to the separate /checkout route).
// Reuses CheckoutForm as-is so the field/validation/employee-selection logic
// stays identical to the retained /checkout route — only the submit button
// and outer chrome differ.
const ReceiverDetailsCard = ({ collapsed, onToggle, amountConfirmed, id }: ReceiverDetailsCardProps) => {
    const dispatch = useAppDispatch();
    const { userDetails, formDetails, addressDetails, productDetails, isBuyAgain, isResuming } =
        useAppSelector(state => state.reducer.giftcardCheckout);
    const { handleSubmission, loading } = usePayment();

    // Mirrors BuyForm's own hasMatchingPrefill check, computed from the same
    // synchronous (pre-effect) redux snapshot at mount — addressDetails can
    // otherwise still hold a previous, different gift card's receiver details
    // at the instant this component mounts, since BuyForm's reset for that
    // case (resetsetAddressData) only runs in an effect, after this initial
    // render has already happened. True whenever redux already belongs to *this*
    // product — a genuine "Buy Again" (isBuyAgain), or resuming an in-progress
    // purchase after navigating back from the payment page (isResuming, set by
    // usePayment right before it navigates there).
    const hasMatchingPrefill =
        (isBuyAgain || isResuming) &&
        Boolean(id) &&
        String(productDetails.id) === String(id) &&
        Boolean(formDetails.amount);

    // Buy Now stays disabled until the Buy card's Continue has been clicked
    // (amountConfirmed) for *this* product, with the stored amount itself
    // still checked as a belt-and-braces backstop (formDetails.amount is only
    // ever set once BuyForm's own min/max/denomination validation passes).
    const amount = Number(formDetails.amount);
    const hasConfirmedAmount =
        amountConfirmed && Boolean(formDetails.amount) && !Number.isNaN(amount) && amount > 0;

    const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);
    const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);

    // If the amount gets unconfirmed (user went back and edited it) while this
    // card is open, force it closed again — filling in receiver details makes
    // no sense against an amount that's no longer confirmed.
    useEffect(() => {
        if (!amountConfirmed && !collapsed) {
            onToggle(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amountConfirmed]);

    const handleHeaderClick = () => {
        if (!amountConfirmed) return;
        onToggle(!collapsed);
    };

    const initialAddressDetails = useRef(addressDetails);
    const initialValues = useMemo(
        () => ({
            receiverFirstName: hasMatchingPrefill
                ? initialAddressDetails.current.receiverFirstName || ''
                : '',
            receiverEmail: hasMatchingPrefill
                ? initialAddressDetails.current.receiverEmail || ''
                : '',
            employee: [],
            message: hasMatchingPrefill ? initialAddressDetails.current.message || '' : '',
            senderName: hasMatchingPrefill
                ? initialAddressDetails.current.senderName || userDetails?.userName || ''
                : userDetails?.userName || '',
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    return (
        <Flex
            vertical
            className={`bg-white border border-[#f4f4f4] rounded-[2rem] shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)] mt-5 ${
                collapsed ? 'px-6 py-5' : 'p-5 md:p-8'
            }`}
        >
            <Flex
                justify="space-between"
                align="center"
                className={amountConfirmed ? 'cursor-pointer' : 'opacity-50'}
                onClick={handleHeaderClick}
            >
                {collapsed ? (
                    <Typography.Text className="text-lg font-semibold">Receiver Details</Typography.Text>
                ) : (
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Receiver Details
                    </Typography.Title>
                )}
                <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-brandSurface text-brandPrimary transition-transform ${
                        collapsed ? '' : 'rotate-90'
                    }`}
                >
                    <RightOutlined className="text-xs" />
                </span>
            </Flex>
            {!collapsed && (
                <Formik
                    enableReinitialize
                    initialValues={initialValues}
                    validationSchema={giftCardSchema(formDetails.orderType, selectAllChecked)}
                    onSubmit={async values => {
                        // Belt-and-braces: the button is disabled until hasConfirmedAmount, but
                        // guard the actual submit too in case that state is ever stale.
                        if (!hasConfirmedAmount) return;

                        if (typeof Moengage?.track_event === 'function') {
                            Moengage.track_event('giftcard_recipient_details', {
                                recipient_name: values.receiverFirstName,
                            });
                        }

                        await dispatch(setAddressData({ ...values, employee: selectedEmployees }));
                        const employeesToSubmit =
                            selectedEmployees.length > 0 ? selectedEmployees : addressDetails.employee;
                        const employeesWithoutLabel = employeesToSubmit.map(
                            ({ label, ...rest }) => rest
                        );

                        handleSubmission({
                            ...values,
                            employee: employeesWithoutLabel,
                            orderType: formDetails.orderType,
                        });
                    }}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} layout="vertical" className="mt-5">
                            <CheckoutForm
                                hideHeading
                                stackFields
                                setSelectedEmployees={setSelectedEmployees}
                                setSelectAllChecked={setSelectAllChecked}
                                selectAllChecked={selectAllChecked}
                            />
                           <div className="flex justify-end mt-2">
        <Button
            className="h-11 w-32 rounded-xl text-base font-semibold"
            type="primary"
            htmlType="submit"
            danger
            loading={loading}
            disabled={!hasConfirmedAmount}
        >
            Buy Now
        </Button>
    </div>
                        </Form>
                    )}
                </Formik>
            )}
        </Flex>
    );
};

export default ReceiverDetailsCard;
