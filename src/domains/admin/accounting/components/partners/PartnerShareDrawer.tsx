import { Form } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

export type PartnerShareFormValues = {
    sharePercentage: string;
    gatewayChargePercentage: string;
    gatewayChargeFixed: string;
};

type PartnerShareDrawerProps = {
    open: boolean;
    title: string;
    initialValues: PartnerShareFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: PartnerShareFormValues) => void;
};

const blankAsUnset = (value: unknown, original: unknown) =>
    original === '' || original === null || original === undefined ? undefined : value;

export const partnerShareSchema = Yup.object({
    sharePercentage: Yup.number()
        .typeError('Enter a valid percentage')
        .min(0, 'Cannot be negative')
        .max(100, 'Cannot exceed 100')
        .required('Share percentage is required'),
    gatewayChargePercentage: Yup.number()
        .transform(blankAsUnset)
        .typeError('Enter a valid percentage')
        .min(0, 'Cannot be negative')
        .max(100, 'Cannot exceed 100'),
    gatewayChargeFixed: Yup.number()
        .transform(blankAsUnset)
        .typeError('Enter a valid amount')
        .min(0, 'Cannot be negative'),
});

const PartnerShareDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
}: PartnerShareDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={partnerShareSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as PartnerShareFormValues)}
        isLoading={isLoading}
        firstBtnTxt="Save"
        reinitialise
    >
        <Form layout="vertical">
            <TextInput
                name="sharePercentage"
                label="Partner share (%)"
                placeholder="e.g. 15"
                type="text"
                allowDecimalsOnly
                isRequired
            />
            <TextInput
                name="gatewayChargePercentage"
                label="Gateway charge (%)"
                placeholder="e.g. 1.95"
                type="text"
                allowDecimalsOnly
            />
            <TextInput
                name="gatewayChargeFixed"
                label="Gateway charge per transaction (₹)"
                placeholder="e.g. 3"
                type="text"
                allowDecimalsOnly
            />
        </Form>
    </CustomModalWithForm>
);

export default PartnerShareDrawer;
