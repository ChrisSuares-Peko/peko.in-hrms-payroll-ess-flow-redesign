import { Form, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { CHARGE_FORM_LABELS } from './paymentLinkChargeColumns';
import { ChargeFormValues } from '../../utils/paymentLinkCharge';

type PaymentLinkChargeDrawerProps = {
    open: boolean;
    title: string;
    note?: string;
    initialValues: ChargeFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: ChargeFormValues) => void;
};

export const paymentLinkChargeSchema = Yup.object({
    percentage: Yup.number()
        .typeError('Enter a valid percentage')
        .min(0, 'Cannot be negative')
        .max(100, 'Cannot exceed 100')
        .required('Charge percentage is required'),
    fixed: Yup.number()
        .typeError('Enter a valid amount')
        .min(0, 'Cannot be negative')
        .required('Charge per transaction is required'),
});

const PaymentLinkChargeDrawer = ({
    open,
    title,
    note,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
}: PaymentLinkChargeDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={paymentLinkChargeSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as ChargeFormValues)}
        isLoading={isLoading}
        firstBtnTxt="Save"
        reinitialise
    >
        <Form layout="vertical">
            {note ? (
                <Typography.Paragraph className="text-[13px] text-textBody">
                    {note}
                </Typography.Paragraph>
            ) : null}
            <TextInput
                name="percentage"
                label={CHARGE_FORM_LABELS.percentage}
                placeholder="e.g. 1.5"
                type="text"
                allowDecimalsOnly
                isRequired
            />
            <TextInput
                name="fixed"
                label={CHARGE_FORM_LABELS.fixed}
                placeholder="e.g. 3"
                type="text"
                allowDecimalsOnly
                isRequired
            />
        </Form>
    </CustomModalWithForm>
);

export default PaymentLinkChargeDrawer;
