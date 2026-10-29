import { useMemo, useState } from 'react';

import { Flex, Modal } from 'antd';

import PaymentLinkCreated from './PaymentLinkCreated';
import SendPaymentLink from './SendPaymentLink';
import { SendPaymentLinkFormValues } from '../../../types/CollectPayment';
import LeftHeader from '../../shared/LeftHeader';

interface PaymentLinkModalProps {
    open: boolean;
    onCancel: () => void;
    documentData?: {
        id?: number;
        amount?: string | number;
        customerName?: string;
        customerPhone?: string;
    };
}

const PaymentLinkModal = ({ open, onCancel, documentData }: PaymentLinkModalProps) => {
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
            amount: documentData?.amount ? String(documentData.amount) : '',
            customerName: documentData?.customerName ?? '',
            customerPhone: documentData?.customerPhone ?? '',
        }),
        [documentData]
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
                        documentId={documentData?.id != null ? String(documentData.id) : undefined}
                    />
                </Flex>
            )}
        </Modal>
    );
};

export default PaymentLinkModal;
