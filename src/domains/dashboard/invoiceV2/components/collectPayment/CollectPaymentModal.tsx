import React, { useState } from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CollectPaymentOptions from './CollectPaymentOptions';
import PaymentReceived from './PaymentReceived';
import RecordManually from './RecordManually';
import UpiCollect from './UpiCollect';
import {
    COLLECT_PAYMENT_STEP_META,
    COLLECT_PAYMENT_SUCCESS_STEPS,
} from '../../constants/collectPayment';
import { CollectPaymentStep, SendPaymentLinkFormValues } from '../../types/CollectPayment';
import { InvoiceRow } from '../../types/invoice';
import { VirtualAccountResponse } from '../../types/ManageBankAccounts';
import { formatAmount } from '../../utils/helperFunctions';
import LeftHeader from '../shared/LeftHeader';
import PaymentLinkCreated from '../shared/PaymentLinkCreated';
import SendPaymentLink from '../shared/SendPaymentLink';

type Props = {
    open: boolean;
    onClose: () => void;
    invoice: InvoiceRow | null;
    step: CollectPaymentStep;
    onStepChange: (step: CollectPaymentStep) => void;
    onPaymentSuccess?: () => void;
    resolveOnboardingStatus: () => Promise<{
        isOnboarded: boolean;
        record: VirtualAccountResponse | null;
    }>;
};

const CollectPaymentModal: React.FC<Props> = ({
    open,
    onClose,
    invoice,
    step,
    onStepChange,
    onPaymentSuccess,
    resolveOnboardingStatus,
}) => {
    const [paymentLinkData, setPaymentLinkData] = useState<SendPaymentLinkFormValues | null>(null);
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [paymentLinkExpiresAt, setPaymentLinkExpiresAt] = useState<string | undefined>(undefined);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [loadingStep, setLoadingStep] = useState<CollectPaymentStep | null>(null);
    const navigate = useNavigate();
    const { title, subtitle } = COLLECT_PAYMENT_STEP_META[step];
    const isSuccessStep = COLLECT_PAYMENT_SUCCESS_STEPS.includes(step);

    const handleStepSelect = async (nextStep: CollectPaymentStep) => {
        if (loadingStep) return;

        if (nextStep === 'send-link') {
            setLoadingStep(nextStep);
            try {
                const result = await resolveOnboardingStatus();
                if (!result.isOnboarded) {
                    setNeedsOnboarding(true);
                    return;
                }
            } finally {
                setLoadingStep(null);
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
                        <>
                            <LeftHeader title={title} description={subtitle} />

                            {/* Invoice summary card */}
                            <Flex
                                justify="space-between"
                                align="center"
                                className="bg-[#F8FAFC] rounded-2xl px-5 py-3"
                            >
                                <Flex vertical gap={4}>
                                    <Typography.Text className="text-[#101828] text-sm font-semibold block">
                                        {invoice?.prefix ? `${invoice.prefix}${invoice.invoiceNumber}` : invoice?.invoiceNumber}
                                    </Typography.Text>
                                    <Typography.Text className="text-[#475569] text-xs font-normal block">
                                        {invoice?.name}
                                    </Typography.Text>
                                </Flex>
                                <Typography.Text className="text-green-700 text-base font-semibold">
                                    {formatAmount(Number(invoice?.amountDue ?? 0))}
                                </Typography.Text>
                            </Flex>
                        </>
                    )}

                    {/* Dynamic content */}
                    {step === 'options' && (
                        <CollectPaymentOptions
                            onSelect={handleStepSelect}
                            loadingStep={loadingStep}
                        />
                    )}
                    {step === 'send-link' && (
                        <SendPaymentLink
                            onCancel={onClose}
                            invoiceId={invoice?.id}
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
                    {step === 'upi' && (
                        <UpiCollect
                            invoice={invoice}
                            onSuccess={() => onStepChange('payment-received')}
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
                            paymentLink={paymentLink}
                            expiresAt={paymentLinkExpiresAt}
                            onCreateAnother={() => onStepChange('send-link')}
                            title={title}
                            subtitle={subtitle}
                        />
                    )}
                    {step === 'payment-received' && (
                        <PaymentReceived invoice={invoice} onClose={onClose} title={title} />
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
