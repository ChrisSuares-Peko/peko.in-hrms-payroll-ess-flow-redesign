import React from 'react';

import { Flex, Form, Skeleton } from 'antd';
import dayjs from 'dayjs';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import useGetPackages from '@src/domains/admin/settings/hooks/pekoCredits/useGetPackages';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import UseCreateCouponCodes from '../../hooks/pekoCredits/useCreateSubscriptionCoupon';
import useGetAllServiceOperators from '../../hooks/pekoCredits/useGetAllServiceOperators';
import useGetReferralCodes from '../../hooks/pekoCredits/useGetReferralCodes';
import couponCodeSchema from '../../schema/pekoCreditsSchema';
import { refresh } from '../../types/accessCode';
import { Coupon } from '../../types/pekoCredits';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Coupon;
};
const SubscriptionCouponModal = ({
    open,
    handleCancel,
    setRefresh,
    data,
}: ModalProps & refresh) => {
    const {
        packageData,
        isLoading: packagLoading,
        setPartnerId,
        partnerId: selectedPartnerId,
    } = useGetPackages({ partnerId: data?.partnerId || 'default' });
    const { serviceData, serviceOperatorLoading } = useGetAllServiceOperators();
    const { partnerData } = usePartnersForCorporate('');
    const { codeData } = useGetReferralCodes(selectedPartnerId, '');

    const { isLoading, createNewCouponCode, updateCurrenCouponCode } = UseCreateCouponCodes({
        handleCancel,
        setRefresh,
    });

    const getPartnerId = () => {
        const partnerId = data?.partnerId;
        if (partnerId === 'default') return partnerId;
        return Number(partnerId);
    };
    const today = dayjs().add(0, 'day').startOf('day');

    const billingData = [
        {
            value: 'MONTHLY',
            label: 'Monthly',
        },
        {
            value: 'ANNUALLY',
            label: 'Annually',
        },
    ];

    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Coupon Management"
            open={open}
            validationSchema={couponCodeSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values =>
                data
                    ? updateCurrenCouponCode({ ...values, id: data.id })
                    : createNewCouponCode(values)
            }
            initialValues={{
                code: data?.code || '',
                discountType: data?.discountType || '',
                discount: data?.discount ? parseFloat(data?.discount) : '',
                couponType: data?.couponType || '',
                billingType: data?.billingType || '',
                serviceOperatorId: data?.serviceOperatorId?.toString() || '',
                packageId: data?.packageId || '',
                expiryDays: data?.expiryDays || '',
                partnerId: getPartnerId() || 'default',
                referralCodeId: data?.referralCodeId || 'default',
                minimumPurchase: data?.minimumPurchase ? parseFloat(data?.minimumPurchase) : '',
                maximumDiscount: data?.maximumDiscount ? parseFloat(data?.maximumDiscount) : '',
                notifyCorporates: false,
                validUntil: data?.validUntil || '',
            }}
        >
            {({ setFieldValue, values }) => (
                <Flex vertical className="w-full">
                    <Form layout="vertical">
                        {partnerData ? (
                            <SelectInputWithSearch
                                name="partnerId"
                                options={partnerData}
                                placeholder="Please select a partner"
                                label="Select Partner"
                                handleChange={e => {
                                    setFieldValue('packageId', '');
                                    setPartnerId(e);
                                }}
                                disableDeselect
                            />
                        ) : (
                            <Skeleton.Input active block />
                        )}
                        {codeData ? (
                            <SelectInputWithSearch
                                name="referralCodeId"
                                options={codeData}
                                placeholder="Please select a referral code"
                                label="Select Referral Code"
                                disableDeselect
                            />
                        ) : (
                            <Skeleton.Input active block />
                        )}

                        <SelectInput
                            name="couponType"
                            isRequired
                            options={[
                                { value: 'SUBSCRIPTION', label: 'Subscription coupon' },
                                { value: 'SERVICES', label: 'Service coupon' },
                            ]}
                            placeholder="Please select a discount type"
                            label="Coupon type"
                        />
                        {values.couponType === 'SUBSCRIPTION' &&
                            (!packagLoading ? (
                                <SelectInputWithSearch
                                    isRequired
                                    name="packageId"
                                    options={packageData}
                                    placeholder="Please select a package"
                                    label="Package Name"
                                />
                            ) : (
                                <Skeleton.Input active block />
                            ))}
                        {values.couponType === 'SUBSCRIPTION' &&
                            (!serviceOperatorLoading ? (
                                <SelectInputWithSearch
                                    isRequired
                                    name="billingType"
                                    options={billingData || []}
                                    placeholder="Please select billing type"
                                    label="Billing Type"
                                />
                            ) : (
                                <Skeleton.Input active block className="my-2" />
                            ))}
                        {values.couponType === 'SERVICES' &&
                            (!serviceOperatorLoading ? (
                                <SelectInputWithSearch
                                    isRequired
                                    name="serviceOperatorId"
                                    options={serviceData || []}
                                    placeholder="Please select an operator"
                                    label="Select Operator"
                                />
                            ) : (
                                <Skeleton.Input active block className="my-2" />
                            ))}

                        <TextInput
                            name="code"
                            label="Coupon Code"
                            type="text"
                            placeholder="Enter coupon code"
                            isRequired
                            classes="rounded-sm"
                            maxLength={20}
                            allowAlphabetsAndNumbersOnly
                            handleChange={value =>
                                setFieldValue(
                                    'code',
                                    value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase()
                                )
                            }
                        />
                        <SelectInput
                            name="discountType"
                            isRequired
                            options={[
                                { value: 'FLAT', label: 'Flat' },
                                { value: 'PERCENTAGE', label: 'Percentage' },
                            ]}
                            placeholder="Please select a discount type"
                            label="Discount Type"
                        />
                        <TextInput
                            name="discount"
                            label="Total Discount"
                            type="text"
                            placeholder="Please enter discount"
                            isRequired
                            classes="rounded-sm"
                            maxLength={8}
                            allowTwoDecimalsOnly
                        />
                        <TextInput
                            name="minimumPurchase"
                            label="Minimum Purchase Value"
                            type="text"
                            placeholder="Please enter minimum purchase value"
                            isRequired
                            classes="rounded-sm"
                            maxLength={8}
                            allowTwoDecimalsOnly
                        />

                        {values.discountType === 'PERCENTAGE' && (
                            <TextInput
                                name="maximumDiscount"
                                label="Maximum Discount Amount"
                                type="text"
                                placeholder="Please enter maximum discount"
                                isRequired
                                classes="rounded-sm"
                                maxLength={8}
                                allowTwoDecimalsOnly
                            />
                        )}
                        <TextInput
                            name="expiryDays"
                            label="Expiry Days"
                            type="text"
                            placeholder="Please enter expiry days"
                            isRequired
                            allowNumbersOnly
                            classes="rounded-sm"
                            maxLength={3}
                            maxValue={365}
                        />
                        <DatePickerInput
                            name="validUntil"
                            label="Validity"
                            placeholder="Select date"
                            classes="w-full"
                            isRequired
                            needConfirm={false}
                            minDate={today}
                        />
                        {!data && (
                            <CheckboxInput name="notifyCorporates">Notify Users</CheckboxInput>
                        )}
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default SubscriptionCouponModal;
