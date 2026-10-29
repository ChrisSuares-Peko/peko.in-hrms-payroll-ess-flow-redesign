import React from 'react';

import { Button, Flex } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import RecordManuallyForm from '../../../forms/collectPayment/RecordManuallyForm';
import useRecordManually from '../../../hooks/collectPayment/useRecordManually';
import { useFormAutoFocus } from '../../../hooks/useFormAutoFocus';
import { recordManuallySchema } from '../../../schema/collectPayment/recordManuallySchema';
import { RecordManuallyFormValues } from '../../../types/CollectPayment';
import { DocumentRow } from '../../../types/documents';

type Props = {
    onCancel: () => void;
    invoice: DocumentRow | null;
    onPaymentSuccess?: () => void;
};

const RecordManually: React.FC<Props> = ({ onCancel, invoice, onPaymentSuccess }) => {
    const { savePayment, isLoading } = useRecordManually(invoice?.id);
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({ schema: recordManuallySchema });

    const handleSubmit = (values: RecordManuallyFormValues) => {
        savePayment(values, () => {
            onPaymentSuccess?.();
            onCancel();
        });
    };

    const today = dayjs().format('YYYY-MM-DD');

    return (
        <Formik
            initialValues={{
                amountPaid: invoice?.amountDue || '',
                paymentMethod: 'Cash',
                paymentDate: today,
                referenceId: '',
                notes: '',
            }}
            validationSchema={recordManuallySchema}
            onSubmit={handleSubmit}
        >
            {({ handleSubmit: formikSubmit, setFieldTouched, values }) => (
                <Flex vertical gap={4}>
                    <RecordManuallyForm />
                    <Flex gap={12}>
                        <Button
                            block
                            className="h-9 rounded-lg border-[#CBD5E1] text-[#475569]"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            block
                            type="primary"
                            danger
                            loading={isLoading}
                            className="h-9 rounded-lg"
                            onClick={() => handleFormSubmitWithAutoFocus(formikSubmit, setFieldTouched, values)}
                        >
                            Save Payment
                        </Button>
                    </Flex>
                </Flex>
            )}
        </Formik>
    );
};

export default RecordManually;
