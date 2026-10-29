import React from 'react';

import { Button, Flex } from 'antd';
import { Formik } from 'formik';

import SendPaymentLinkForm from '../../../forms/collectPayment/SendPaymentLinkForm';
import useSendPaymentLink from '../../../hooks/collectPayment/useSendPaymentLink';
import { sendPaymentLinkSchema } from '../../../schema/collectPayment/sendPaymentLinkSchema';
import { SendPaymentLinkFormValues } from '../../../types/CollectPayment';

type Props = {
    onCancel: () => void;
    onSuccess: (values: SendPaymentLinkFormValues, paymentLink: string, expiresAt?: string) => void;
    initialValues?: Partial<SendPaymentLinkFormValues>;
    documentId?: string;
};

const DEFAULT_VALUES: SendPaymentLinkFormValues = {
    amount: '',
    customerName: '',
    customerPhone: '',
};

const SendPaymentLink: React.FC<Props> = ({ onCancel, onSuccess, initialValues, documentId }) => {
    const { generatePaymentLink, isLoading } = useSendPaymentLink(documentId);

    const handleSubmit = (values: SendPaymentLinkFormValues) => {
        generatePaymentLink(values, onSuccess);
    };

    return (
        <Formik
            initialValues={{ ...DEFAULT_VALUES, ...initialValues }}
            validationSchema={sendPaymentLinkSchema}
            onSubmit={handleSubmit}
        >
            {({ submitForm }) => (
                <Flex vertical gap={4}>
                    <SendPaymentLinkForm />
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
                            onClick={submitForm}
                        >
                            Generate Payment Link
                        </Button>
                    </Flex>
                </Flex>
            )}
        </Formik>
    );
};

export default SendPaymentLink;
