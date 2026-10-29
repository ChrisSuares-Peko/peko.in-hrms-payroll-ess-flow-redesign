import React, { useState } from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CollectPaymentOptions from './CollectPaymentOptions';
import PaymentLinkCreated from './paymentLink/PaymentLinkCreated';
import SendPaymentLink from './paymentLink/SendPaymentLink';
import RecordManually from './recordManual/RecordManually';
import { COLLECT_PAYMENT_STEP_META } from '../../constants/collectPayment';
import useOnboarding from '../../hooks/useOnboarding';
import { CollectPaymentStep, SendPaymentLinkFormValues } from '../../types/CollectPayment';
import { DocumentRow } from '../../types/documents';
import Invoicesummary from '../shared/Invoicesummary';

type Props = {
    open: boolean;
    onClose: () => void;
    invoice: DocumentRow | null;
    step: CollectPaymentStep;
    onStepChange: (step: CollectPaymentStep) => void;
    onPaymentSuccess?: () => void;
};

const CollectPaymentModal: React.FC<Props> = ({
    open,
    onClose,
    invoice,
    step,
    onStepChange,
    onPaymentSuccess,
}) => {
    const [paymentLinkData, setPaymentLinkData] = useState<SendPaymentLinkFormValues | null>(null);
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [paymentLinkExpiresAt, setPaymentLinkExpiresAt] = useState<string | undefined>(undefined);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const { checkOnboardingStatus } = useOnboarding();
    const navigate = useNavigate();
    const { title, subtitle } = COLLECT_PAYMENT_STEP_META[step];
    const isSuccessStep = step === 'payment-link-created';

    const handleStepSelect = async (nextStep: CollectPaymentStep) => {
        if (nextStep === 'send-link') {
            const isOnboarded = await checkOnboardingStatus();
            if (!isOnboarded) {
                setNeedsOnboarding(true);
                return;
            }
        }
        onStepChange(nextStep);
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={() => {
                    setPaymentLinkData(null);
                    setPaymentLink(null);
                    onClose();
                }}
                width={520}
                centered
                footer={null}
                closable={false}
                destroyOnHidden
                className="[&_.ant-modal-content]:rounded-[20px] [&_.ant-modal-content]:p-7"
            >
                <Flex vertical gap={12}>
                    {!isSuccessStep && (
                        <Invoicesummary
                            title={title}
                            description={subtitle}
                            customerName={invoice?.name || ''}
                            invoiceNo={`${invoice?.prefix}${invoice?.documentNumber}` || ''}
                            amount={invoice?.amountDue || 0}
                        />
                    )}

                    {/* Dynamic content */}
                    {step === 'options' && <CollectPaymentOptions onSelect={handleStepSelect} />}
                    {step === 'send-link' && (
                        <SendPaymentLink
                            onCancel={onClose}
                            documentId={invoice?.id}
                            onSuccess={(values, link, expiresAt) => {
                                setPaymentLinkData(values);
                                setPaymentLink(link);
                                setPaymentLinkExpiresAt(expiresAt);
                                onStepChange('payment-link-created');
                            }}
                            initialValues={{
                                amount: invoice?.amountDue || invoice?.totalAmount || '',
                                customerName: invoice?.name || '',
                                customerPhone: invoice?.phoneNumber || '',
                            }}
                        />
                    )}
                    {step === 'record' && (
                        <RecordManually
                            invoice={invoice}
                            onCancel={onClose}
                            onPaymentSuccess={onPaymentSuccess}
                        />
                    )}
                    {step === 'payment-link-created' && paymentLinkData && paymentLink && (
                        <PaymentLinkCreated
                            values={paymentLinkData}
                            expiresAt={paymentLinkExpiresAt}
                            paymentLink={paymentLink}
                            onCreateAnother={() => onStepChange('send-link')}
                            title={title}
                            subtitle={subtitle}
                        />
                    )}
                </Flex>
            </Modal>

            <Modal
                open={needsOnboarding}
                onCancel={() => setNeedsOnboarding(false)}
                width={420}
                centered
                footer={null}
                className="[&_.ant-modal-content]:rounded-[20px] [&_.ant-modal-content]:p-7"
            >
                <Flex vertical gap={16} align="center" className="text-center">
                    <ExclamationCircleFilled className="text-[40px] text-amber-500" />
                    <Typography.Title level={5} className="!mb-0">
                        Onboarding required
                    </Typography.Title>
                    <Typography.Text className="text-[#475569]">
                        Complete your Payment Links onboarding to start generating payment links.
                        Verification can take some time after you submit.
                    </Typography.Text>
                    <Flex gap={12} className="w-full pt-1">
                        <Button block className="h-9 rounded-lg" onClick={() => setNeedsOnboarding(false)}>
                            Cancel
                        </Button>
                        <Button
                            block
                            type="primary"
                            danger
                            className="h-9 rounded-lg"
                            onClick={() => navigate(paths.dashboard.paymentLinks)}
                        >
                            Go to Onboarding
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </>
    );
};

export default CollectPaymentModal;
