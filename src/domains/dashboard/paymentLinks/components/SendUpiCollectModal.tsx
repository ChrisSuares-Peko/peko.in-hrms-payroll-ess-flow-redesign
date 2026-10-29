import { useEffect, useRef, useState } from 'react';

import { message, Modal } from 'antd';
import dayjs from 'dayjs';

import UpiCollectFailedView from './UpiCollectFailedView';
import UpiCollectFormView from './UpiCollectFormView';
import UpiCollectPendingView from './UpiCollectPendingView';
import UpiCollectSuccessView from './UpiCollectSuccessView';
import { useSendUpiCollect } from '../hooks/useSendUpiCollect';
import { UpiCollectFormState, upiCollectInitialValues } from '../types/paymentLinkTypes';

interface SendUpiCollectModalProps {
    open: boolean;
    onClose: () => void;
}

const TIMER_SECONDS = 10 * 60;

const SendUpiCollectModal = ({ open, onClose }: SendUpiCollectModalProps) => {
    const { loading, sendCollect } = useSendUpiCollect();
    const [sent, setSent] = useState(false);
    const [success, setSuccess] = useState(false);
    const [failed, setFailed] = useState(false);
    const [submittedForm, setSubmittedForm] = useState<UpiCollectFormState>(upiCollectInitialValues);
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [successTime, setSuccessTime] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (sent && !success) {
            setTimeLeft(TIMER_SECONDS);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setSuccessTime(dayjs().format('MMM D, YYYY [at] h:mm A'));
                        setSuccess(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timerRef.current) clearInterval(timerRef.current);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sent, success]);

    const handleSend = async (values: UpiCollectFormState) => {
        setSubmittedForm(values);

        const result = await sendCollect({
            full_name: values.customerName,
            email: values.email,
            phone_number: values.phone,
            amount: values.amount,
            expires_at: values.expiry * 60,
            purpose_message: "Payment",
            payer_upi: values.upiId,
        });

        if (!result) {
            message.error('Failed to send UPI request. Please try again.');
            return;
        }

        setSent(true);
    };

    const handleClose = () => {
        setSent(false);
        setSuccess(false);
        setFailed(false);
        setSubmittedForm(upiCollectInitialValues);
        onClose();
    };

    const handleCancelRequest = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSent(false);
        setFailed(true);
    };

    const handleRetry = () => {
        setFailed(false);
        setSent(false);
    };

    let modalContent = (
        <UpiCollectFormView
            key={open ? 'open' : 'closed'}
            onCancel={handleClose}
            onSend={handleSend}
            loading={loading}
        />
    );

    if (failed) {
        modalContent = <UpiCollectFailedView onChooseAnother={handleClose} onRetry={handleRetry} />;
    } else if (success) {
        modalContent = <UpiCollectSuccessView amount={submittedForm.amount} successTime={successTime} onClose={handleClose} />;
    } else if (sent) {
        modalContent = (
            <UpiCollectPendingView
                form={submittedForm}
                timeLeft={timeLeft}
                onCancel={handleCancelRequest}
                onSwitchToPaymentLink={() => setSent(false)}
            />
        );
    }

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={560}
            style={{ maxWidth: '95vw' }}
            centered
            className="rounded-3xl"
        >
            {modalContent}
        </Modal>
    );
};

export default SendUpiCollectModal;
