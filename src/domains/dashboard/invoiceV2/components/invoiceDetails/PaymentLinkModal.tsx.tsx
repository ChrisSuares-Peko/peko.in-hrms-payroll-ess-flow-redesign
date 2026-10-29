import { useMemo, useState } from 'react';

import { Flex, Modal } from 'antd';

import { SendPaymentLinkFormValues } from '../../types/CollectPayment';
import LeftHeader from '../shared/LeftHeader';
import PaymentLinkCreated from '../shared/PaymentLinkCreated';
import SendPaymentLink from '../shared/SendPaymentLink';

interface PaymentLinkModalProps {
    open: boolean;
    onCancel: () => void;
    invoiceData?: {
        id?: number;
        amount?: string | number;
        customerName?: string;
        customerPhone?: string;
    };
}

const PaymentLinkModal = ({ open, onCancel, invoiceData }: PaymentLinkModalProps) => {
    const [successData, setSuccessData] = useState<{
        values: SendPaymentLinkFormValues;
        link: string;
    } | null>(null);

    const handleClose = () => {
        setSuccessData(null);
        onCancel();
    };

    const initialValues = useMemo(
        () => ({
            amount: invoiceData?.amount ? String(invoiceData.amount) : '',
            customerName: invoiceData?.customerName ?? '',
            customerPhone: invoiceData?.customerPhone ?? '',
        }),
        [invoiceData]
    );

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={520}
            closable={false}
            destroyOnHidden
            className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-7"
        >
            {successData ? (
                <PaymentLinkCreated
                    values={successData.values}
                    paymentLink={successData.link}
                    onCreateAnother={() => setSuccessData(null)}
                    title="Payment Link Created"
                    subtitle="Share this link with your customer to collect payment"
                />
            ) : (
                <Flex vertical gap={16}>
                    <LeftHeader
                        title="Create Payment Link"
                        description="Enter payment details to generate a shareable link"
                    />
                    <SendPaymentLink
                        onCancel={handleClose}
                        onSuccess={(values, link) => setSuccessData({ values, link })}
                        initialValues={initialValues}
                    />
                </Flex>
            )}
        </Modal>
    );
};

export default PaymentLinkModal;
