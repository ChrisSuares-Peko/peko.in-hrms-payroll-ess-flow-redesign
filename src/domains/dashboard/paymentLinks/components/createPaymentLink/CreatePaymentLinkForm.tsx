import { Button, Flex, Form } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import type { FormState } from './CreatePaymentLinkModal.types';
import { createPaymentLinkSchema } from '../../schema/paymentLinkSchema';

interface CreatePaymentLinkFormProps {
    loading: boolean;
    onCancel: () => void;
    onSubmit: (values: FormState) => void;
    initialValues: FormState;
}

const CreatePaymentLinkForm = ({
    loading,
    onCancel,
    onSubmit,
    initialValues,
}: CreatePaymentLinkFormProps) => (
    <Formik
        initialValues={initialValues}
        validationSchema={createPaymentLinkSchema}
        onSubmit={onSubmit}
        enableReinitialize
    >
        {({ handleSubmit }) => (
            <Form layout="vertical">
                <TextInput
                    name="amount"
                    type="text"
                    size="large"
                    isRequired
                    label="Amount"
                    placeholder="Enter amount"
                    allowTwoDecimalsOnly
                    inputMode="decimal"
                />

                <TextInput
                    name="customerPhone"
                    type="text"
                    size="large"
                    isRequired
                    label="Customer Phone"
                    placeholder="Enter 10-digit customer phone"
                    allowNumbersOnly
                    maxLength={10}
                    inputMode="numeric"
                />

                <TextInput
                    name="customerName"
                    type="text"
                    size="large"
                    label="Customer Name (Optional)"
                    placeholder="Enter Customer Name (Optional)"
                />

                <TextInput
                    name="customerEmail"
                    type="text"
                    size="large"
                    label="Customer Email (Optional)"
                    placeholder="Enter Customer Email (Optional)"
                    inputMode="email"
                />

                <TextInput
                    name="purposeMessage"
                    type="text"
                    size="large"
                    label="Payment Purpose (Optional)"
                    allowAlphabetsAndSpaceOnly
                    placeholder="e.g. Invoice payment, Service fee"
                />

                <Flex gap={12} className="mt-3">
                    <Button size="large" block onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        danger
                        size="large"
                        block
                        loading={loading}
                        onClick={() => handleSubmit()}
                    >
                        Create Payment Link
                    </Button>
                </Flex>
            </Form>
        )}
    </Formik>
);

export default CreatePaymentLinkForm;
