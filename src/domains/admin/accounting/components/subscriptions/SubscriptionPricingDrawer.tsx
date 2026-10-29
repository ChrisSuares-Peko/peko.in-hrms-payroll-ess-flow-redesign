import { Form } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import { CustomerPaysRow } from '@components/atomic/PriceAfterDiscount';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { PEKO_BEARS_DISCOUNT } from '@src/domains/admin/utils/commissionValidation';

export type SubscriptionPricingFormValues = {
    packagePrices: { monthly: string; annually: string };
    discount: { monthly: string; annually: string };
};

type SubscriptionPricingDrawerProps = {
    open: boolean;
    title: string;
    initialValues: SubscriptionPricingFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: SubscriptionPricingFormValues) => void;
};

const money = (label: string) =>
    Yup.number()
        .typeError(`Enter a valid ${label}`)
        .min(0, 'Cannot be negative')
        .required(`${label} is required`);

export const subscriptionPricingSchema = Yup.object({
    packagePrices: Yup.object({
        monthly: money('monthly price'),
        annually: money('annual price'),
    }),
    discount: Yup.object({
        monthly: money('monthly discount'),
        annually: money('annual discount'),
    }),
}).test('discount-within-price', '', function validateDiscount(values) {
    const prices = values.packagePrices ?? {};
    const discount = values.discount ?? {};
    if (Number(discount.monthly) > Number(prices.monthly)) {
        return this.createError({
            path: 'discount.monthly',
            message: 'Discount cannot exceed the monthly price',
        });
    }
    if (Number(discount.annually) > Number(prices.annually)) {
        return this.createError({
            path: 'discount.annually',
            message: 'Discount cannot exceed the annual price',
        });
    }
    return true;
});

const SubscriptionPricingDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
}: SubscriptionPricingDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={subscriptionPricingSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as SubscriptionPricingFormValues)}
        isLoading={isLoading}
        firstBtnTxt="Save"
        reinitialise
    >
        {({ values }) => (
            <Form layout="vertical">
                <TextInput
                    name="packagePrices.monthly"
                    label="Monthly price (₹)"
                    placeholder="0.00"
                    type="text"
                    allowDecimalsOnly
                    isRequired
                    showToolTip
                    tooltipText="Full price, before the discount."
                />
                <TextInput
                    name="discount.monthly"
                    label="Monthly discount (₹)"
                    placeholder="0.00"
                    type="text"
                    allowDecimalsOnly
                    isRequired
                    showToolTip
                    tooltipText={`Flat amount taken off the price. ${PEKO_BEARS_DISCOUNT}`}
                />
                <CustomerPaysRow
                    label="Customer pays (monthly)"
                    price={values.packagePrices?.monthly}
                    discount={values.discount?.monthly}
                />
                <TextInput
                    name="packagePrices.annually"
                    label="Annual price (₹)"
                    placeholder="0.00"
                    type="text"
                    allowDecimalsOnly
                    isRequired
                    showToolTip
                    tooltipText="Full price, before the discount."
                />
                <TextInput
                    name="discount.annually"
                    label="Annual discount (₹)"
                    placeholder="0.00"
                    type="text"
                    allowDecimalsOnly
                    isRequired
                    showToolTip
                    tooltipText={`Flat amount taken off the price. ${PEKO_BEARS_DISCOUNT}`}
                />
                <CustomerPaysRow
                    label="Customer pays (annually)"
                    price={values.packagePrices?.annually}
                    discount={values.discount?.annually}
                />
            </Form>
        )}
    </CustomModalWithForm>
);

export default SubscriptionPricingDrawer;
