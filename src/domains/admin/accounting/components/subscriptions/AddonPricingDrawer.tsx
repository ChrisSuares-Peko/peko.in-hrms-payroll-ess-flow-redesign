import { Form } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

export type AddonPricingFormValues = {
    unitPrice: string;
    baseLimit: string;
};

type AddonPricingDrawerProps = {
    open: boolean;
    title: string;
    initialValues: AddonPricingFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: AddonPricingFormValues) => void;
    unitPriceHint?: string;
    baseLimitHint?: string;
};

const money = (label: string) =>
    Yup.number()
        .typeError(`Enter a valid ${label}`)
        .min(0, 'Cannot be negative')
        .required(`${label} is required`);

export const addonPricingSchema = Yup.object({
    unitPrice: money('unit price'),
    baseLimit: money('base limit'),
});

export const UNIT_PRICE_HINT = 'Unit price for subscription add-ons.';

export const BASE_LIMIT_HINT =
    'The base limit for subscription add-ons: for example, payroll for 20 employees is free with the package.';

// Same copy as the Settings Cashback Management modal's Unit Price/Base Limit pair.
const AddonPricingDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
    unitPriceHint = UNIT_PRICE_HINT,
    baseLimitHint = BASE_LIMIT_HINT,
}: AddonPricingDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={addonPricingSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as AddonPricingFormValues)}
        isLoading={isLoading}
        firstBtnTxt="Save"
        reinitialise
    >
        <Form layout="vertical">
            <TextInput
                name="unitPrice"
                label="Unit Price"
                placeholder="0.00"
                type="text"
                allowDecimalsOnly
                isRequired
                showToolTip
                tooltipText={unitPriceHint}
            />
            <TextInput
                name="baseLimit"
                label="Base Limit"
                placeholder="0.00"
                type="text"
                allowDecimalsOnly
                isRequired
                showToolTip
                tooltipText={baseLimitHint}
            />
        </Form>
    </CustomModalWithForm>
);

export default AddonPricingDrawer;
