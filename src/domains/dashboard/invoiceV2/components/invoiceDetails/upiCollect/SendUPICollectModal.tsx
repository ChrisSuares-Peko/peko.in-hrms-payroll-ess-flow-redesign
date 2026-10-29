import { useEffect, useRef, useState } from 'react';

import { Modal } from 'antd';

import PaymentFailed from './PaymentFailed';
import PaymentRequest from './PaymentRequest';
import PaymentSuccess from './PaymentSuccess';
import UPICollectForm from './UPICollectForm';
import useUpiCollect from '../../../hooks/invoiceDetails/useUpiCollect';
import {
    SendUPICollectFormValues,
    UPICollectPendingData,
    UPICollectStep,
    UPICollectSuccessData,
} from '../../../types/invoiceDetails';

interface SendUPICollectModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    onSwitchToPaymentLink?: () => void;
    invoiceData?: {
        amount?: string | number;
    };
}

const SendUPICollectModal = ({
    open,
    onCancel,
    onSuccess,
    onSwitchToPaymentLink,
    invoiceData,
}: SendUPICollectModalProps) => {
    const [step, setStep] = useState<UPICollectStep>('form');
    const [pendingData, setPendingData] = useState<UPICollectPendingData | null>(null);
    const [successData, setSuccessData] = useState<UPICollectSuccessData | null>(null);
    const [countdown, setCountdown] = useState(0);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { sendUpiRequest, cancelRequest, sendReminder, retryPayment, pollPaymentStatus } =
        useUpiCollect();

    useEffect(() => {
        if (step === 'pending' && countdown > 0) {
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        setStep('failed');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [step, countdown]);

    const clearTimers = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (pollRef.current) clearTimeout(pollRef.current);
    };

    const reset = () => {
        clearTimers();
        setStep('form');
        setPendingData(null);
        setSuccessData(null);
        setCountdown(0);
    };

    const handleClose = () => {
        if (step === 'success') onSuccess();
        reset();
        onCancel();
    };

    const handleFormSubmit = async (values: SendUPICollectFormValues) => {
        const pending = await sendUpiRequest(values);
        setPendingData(pending);
        setCountdown(pending.expiryMinutes * 60);
        setStep('pending');

        pollPaymentStatus(values.amount).then(success => {
            clearTimers();
            setSuccessData(success);
            setStep('success');
        });
    };

    const handleCancel = async () => {
        await cancelRequest();
        handleClose();
    };

    const handleRetry = async () => {
        await retryPayment();
        setStep('form');
    };

    const handleSwitchToPaymentLink = () => {
        reset();
        onCancel();
        onSwitchToPaymentLink?.();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={560}
            closable={false}
            destroyOnHidden
            className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-7"
        >
            {step === 'form' && (
                <UPICollectForm
                    initialAmount={invoiceData?.amount ? String(invoiceData.amount) : ''}
                    onSubmit={handleFormSubmit}
                    onCancel={handleClose}
                />
            )}
            {step === 'pending' && (
                <PaymentRequest
                    pendingData={pendingData!}
                    countdown={countdown}
                    onCancel={handleCancel}
                    onSendReminder={sendReminder}
                    onSwitchToPaymentLink={handleSwitchToPaymentLink}
                />
            )}
            {step === 'success' && (
                <PaymentSuccess successData={successData!} onClose={handleClose} />
            )}
            {step === 'failed' && (
                <PaymentFailed onRetry={handleRetry} onChooseAnother={handleSwitchToPaymentLink} />
            )}
        </Modal>
    );
};

export default SendUPICollectModal;
