import { Button, Flex, Form, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { PAYMENT_MODE_OPTIONS } from '../../constants/settings';

export interface AddPaymentValues {
    amount: string;
    paymentMethod: string;
    paymentDate: string;
    referenceId: string;
    notes: string;
}

interface Props {
    open: boolean;
    maxAmount: number;
    currency?: string;
    saving: boolean;
    onClose: () => void;
    onSave: (values: AddPaymentValues) => Promise<boolean>;
}

const buildSchema = (maxAmount: number, currencyLabel: string) =>
    Yup.object({
        paymentDate: Yup.string().required('Date is required'),
        amount: Yup.number()
            .typeError('Enter a valid amount')
            .positive('Amount must be greater than 0')
            .max(maxAmount, `Amount cannot exceed ${currencyLabel}${maxAmount}`)
            .required('Amount is required'),
        paymentMethod: Yup.string().required('Payment method is required'),
        referenceId: Yup.string(),
        notes: Yup.string(),
    });

const AddPaymentModal = ({ open, maxAmount, currency = 'INR', saving, onClose, onSave }: Props) => {
    const currencyLabel = currency === 'INR' ? '₹' : `${currency} `;
    const formik = useFormik<AddPaymentValues>({
        initialValues: {
            amount: String(maxAmount),
            paymentMethod: '',
            paymentDate: dayjs().format('YYYY-MM-DD'),
            referenceId: '',
            notes: '',
        },
        validationSchema: buildSchema(maxAmount, currencyLabel),
        enableReinitialize: true,
        onSubmit: async values => {
            const ok = await onSave(values);
            if (ok) handleClose();
        },
    });

    const handleClose = () => {
        formik.resetForm();
        onClose();
    };

    return (
        <FormikProvider value={formik}>
            <Modal
                open={open}
                onCancel={handleClose}
                title={
                    <Typography.Text className="text-base font-semibold">
                        Record Payment
                    </Typography.Text>
                }
                footer={null}
                width={480}
                destroyOnClose
            >
                <Form layout="vertical" colon={false} className="mt-4">
                    <DatePickerInput
                        name="paymentDate"
                        label="Date"
                        placeholder="Select date"
                        isRequired
                        classes="w-full"
                        maxDate={dayjs()}
                    />

                    <TextInput
                        name="amount"
                        label="Amount"
                        placeholder="0.00"
                        type="text"
                        isRequired
                        prefix={currencyLabel}
                        allowTwoDecimalsOnly
                    />
                    <Typography.Text className="text-xs text-gray-400 -mt-4 block mb-4">
                        {`Max payable: ${currencyLabel}${maxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </Typography.Text>

                    <SelectInput
                        name="paymentMethod"
                        label="Payment Method"
                        placeholder="Select method"
                        options={PAYMENT_MODE_OPTIONS}
                        isRequired
                    />

                    <TextInput
                        name="referenceId"
                        label="Reference"
                        placeholder="Transaction ID / Cheque no."
                        type="text"
                        maxLength={30}
                    />

                    <InputTextArea
                        name="notes"
                        label="Note"
                        placeholder="Optional note"
                        autoSize={{ minRows: 3 }}
                        maxLength={50}
                    />

                    <Flex justify="flex-end" gap={8} className="mt-2">
                        <Button onClick={handleClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            onClick={() => formik.handleSubmit()}
                            loading={saving}
                        >
                            Save Payment
                        </Button>
                    </Flex>
                </Form>
            </Modal>
        </FormikProvider>
    );
};

export default AddPaymentModal;
