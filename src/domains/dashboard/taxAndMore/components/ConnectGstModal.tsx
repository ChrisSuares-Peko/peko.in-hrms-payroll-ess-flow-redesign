import { useEffect, useRef, useState } from 'react';

import {
    CheckCircleFilled,
    InfoCircleOutlined,
    LoadingOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { authenticateGstPortal, generateGstPortalOtp } from '../api/tax';
import useGstSetup from '../hooks/useGstSetup';
import { gstCredentialsSchema } from '../schema';
import { FINANCIAL_YEARS } from '../utils/data';

type Step = 'credentials' | 'otp' | 'success';

interface ConnectGstModalProps {
    open: boolean;
    onClose: () => void;
    onConnected: (expiresAt: number, username: string) => void;
    /** Pre-fill GSTIN when re-connecting an expired session */
    prefillGstin?: string;
}

const ConnectGstModal = ({ open, onClose, onConnected, prefillGstin }: ConnectGstModalProps) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { create, isCreating } = useGstSetup();

    const [step, setStep] = useState<Step>('credentials');
    const [activeGstin, setActiveGstin] = useState('');
    const [activeUsername, setActiveUsername] = useState('');
    const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [pendingSession, setPendingSession] = useState<{
        expiresAt: number;
        username: string;
    } | null>(null);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Match app pattern: setTimeout-based countdown (same as OtpModal)
    useEffect(() => {
        if (step !== 'otp') return undefined;
        const timer = setTimeout(() => {
            if (timeRemaining > 0) {
                setTimeRemaining(t => t - 1);
            } else {
                setResendDisabled(false);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeRemaining, step]);

    // Reset form state every time the modal opens
    const hasSentOtp = useRef(false);
    useEffect(() => {
        if (open) {
            setStep('credentials');
            setActiveGstin(prefillGstin ?? '');
            setActiveUsername('');
            setOtp(Array(6).fill(''));
            setMaskedPhone(null);
            setPendingSession(null);
            setResendDisabled(true);
            setTimeRemaining(120);
            hasSentOtp.current = false;
        } else {
            setTimeRemaining(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Auto-send OTP when entering otp step
    useEffect(() => {
        if (step === 'otp' && activeGstin && !hasSentOtp.current) {
            hasSentOtp.current = true;
            handleSendOtp();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, activeGstin]);

    const handleClose = () => {
        onClose();
    };

    // Step 1: verify GSTIN + create setup, then move to OTP
    const handleCredentials = async (values: {
        gstin: string;
        financialYear: string;
        username: string;
    }) => {
        const success = await create({ gstin: values.gstin, financialYear: values.financialYear });
        if (success) {
            setActiveGstin(values.gstin);
            setActiveUsername(values.username);
            hasSentOtp.current = false;
            setStep('otp');
        }
    };

    // Send (or re-send) OTP to the mobile registered with this GSTIN
    const handleSendOtp = async (): Promise<boolean> => {
        if (!activeGstin || !activeUsername) return false;
        setIsSendingOtp(true);
        const resp = await generateGstPortalOtp({
            userId: id,
            userType: role,
            gstin: activeGstin,
            username: activeUsername,
        });
        setIsSendingOtp(false);
        if (resp && (resp as any).status) {
            setMaskedPhone((resp as any).data?.maskedPhone ?? null);
            return true;
        }
        dispatch(
            showToast({ description: 'Failed to send OTP. Please try again.', variant: 'error' })
        );
        return false;
    };

    const handleResendClick = async () => {
        if (resendDisabled) return;
        setOtp(Array(6).fill(''));
        hasSentOtp.current = false;
        const success = await handleSendOtp();
        if (success) {
            setResendDisabled(true);
            setTimeRemaining(120);
            dispatch(showToast({ description: 'OTP sent successfully.', variant: 'success' }));
        }
    };

    // Step 2: verify OTP → get 6-hr session
    const handleVerifyOtp = async () => {
        const otpStr = otp.join('');
        if (otpStr.length !== 6) return;
        setIsVerifying(true);
        const resp = await authenticateGstPortal({
            userId: id,
            userType: role,
            gstin: activeGstin,
            otp: otpStr,
            username: activeUsername,
        });
        setIsVerifying(false);
        if (resp && (resp as any).status) {
            setPendingSession({
                expiresAt: (resp as any).data?.expiresAt ?? Date.now() + 6 * 3600 * 1000,
                username: activeUsername,
            });
            setStep('success');
        } else {
            dispatch(
                showToast({
                    description: (resp as any)?.message || 'Incorrect OTP. Please try again.',
                    variant: 'error',
                })
            );
            setOtp(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const otpComplete = otp.every(d => d !== '');

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={500}
            centered
            styles={{ body: { padding: '32px' } }}
        >
            {/* Header */}
            <Flex vertical gap={4} className="mb-6">
                <Typography.Title level={4} className="!mb-0 !font-semibold text-[#1e293b]">
                    Connect GST Portal
                </Typography.Title>
                <Typography.Text className="text-sm text-[#475569]">
                    Authenticate using your registered mobile number
                </Typography.Text>
            </Flex>

            {/* ── Step 1: GSTIN + FY + Username ── */}
            {step === 'credentials' && (
                <Formik
                    initialValues={{
                        gstin: prefillGstin ?? '',
                        financialYear: FINANCIAL_YEARS[0],
                        username: '',
                    }}
                    enableReinitialize
                    validationSchema={gstCredentialsSchema}
                    onSubmit={handleCredentials}
                >
                    {({ submitForm }) => (
                        <Flex vertical gap={4}>
                            <div className="w-full">
                                <TextInput
                                    name="gstin"
                                    label="GSTIN"
                                    placeholder="e.g. 29ABCDE1234F1Z5"
                                    type="text"
                                    isRequired
                                    maxLength={15}
                                    convertToUppercase
                                    restrictPanGstFormat
                                />
                                <TextInput
                                    name="financialYear"
                                    label="Financial Year"
                                    placeholder="e.g. 2024-25"
                                    type="text"
                                    isRequired
                                />
                                <TextInput
                                    name="username"
                                    label="GST Portal Username"
                                    placeholder="Enter your GST portal username"
                                    type="text"
                                    isRequired
                                    allowAlphabetsNumberAndSpecialCharacters={['.']}
                                />
                            </div>
                            <Flex
                                gap={8}
                                align="center"
                                className="rounded-lg px-4 py-3 mb-4"
                                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                            >
                                <InfoCircleOutlined className="text-[#475569] flex-shrink-0" />
                                <Typography.Text className="text-xs text-[#475569]">
                                    We&apos;ll verify your GSTIN and send an OTP to the registered
                                    mobile number.
                                </Typography.Text>
                            </Flex>
                            <Button
                                type="primary"
                                danger
                                block
                                size="large"
                                icon={<SafetyCertificateOutlined />}
                                iconPosition="end"
                                loading={isCreating}
                                onClick={submitForm}
                                style={{ height: 48, fontSize: 15, fontWeight: 500 }}
                            >
                                Verify &amp; Continue
                            </Button>
                        </Flex>
                    )}
                </Formik>
            )}

            {/* ── Step 2: OTP Entry ── */}
            {step === 'otp' && (
                <Flex vertical gap={24} align="center">
                    {isSendingOtp ? (
                        <Flex vertical gap={12} align="center" className="py-6">
                            <LoadingOutlined style={{ fontSize: 32, color: '#FF3A3A' }} spin />
                            <Typography.Text className="text-sm text-[#475569]">
                                Sending OTP...
                            </Typography.Text>
                        </Flex>
                    ) : (
                        <>
                            <Flex
                                gap={8}
                                align="center"
                                className="rounded-xl px-4 py-3 w-full"
                                style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                            >
                                <InfoCircleOutlined
                                    style={{ color: '#16a34a', fontSize: 14, flexShrink: 0 }}
                                />
                                <Typography.Text className="text-sm text-[#15803d]">
                                    OTP sent to{' '}
                                    <span className="font-semibold">
                                        {maskedPhone
                                            ? `+91 ${maskedPhone}`
                                            : 'your registered mobile number'}
                                    </span>
                                </Typography.Text>
                            </Flex>

                            <Flex vertical gap={8} align="center" className="w-full">
                                <Typography.Text className="text-sm font-semibold text-[#1e293b]">
                                    Enter 6-digit OTP
                                </Typography.Text>
                                <Flex gap={10} justify="center">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={el => {
                                                inputRefs.current[i] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className="w-[52px] h-[52px] text-center text-xl font-semibold border border-gray-300 rounded-md otpInput outline-none focus:border-brandColor focus:ring-2 focus:ring-[#fecaca] transition-all text-[#1e293b] bg-white"
                                        />
                                    ))}
                                </Flex>

                                {/* Timer / Resend — matches OtpModal.tsx pattern */}
                                {isSendingOtp && (
                                    <Typography.Text className="text-sm font-normal underline cursor-not-allowed text-textDisabledGray">
                                        Sending ...
                                    </Typography.Text>
                                )}
                                {!isSendingOtp && resendDisabled && (
                                    <Typography.Text className="text-sm font-normal text-green-500">
                                        Time Remaining: {formatTime(timeRemaining)}
                                    </Typography.Text>
                                )}
                                {!isSendingOtp && !resendDisabled && (
                                    <Typography.Text
                                        className="text-sm font-normal underline cursor-pointer text-gray-800"
                                        onClick={handleResendClick}
                                    >
                                        Resend OTP
                                    </Typography.Text>
                                )}
                            </Flex>

                            <Button
                                type="primary"
                                danger
                                block
                                size="large"
                                disabled={!otpComplete}
                                loading={isVerifying}
                                onClick={handleVerifyOtp}
                                style={{ height: 48, fontSize: 15, fontWeight: 600 }}
                            >
                                Verify &amp; Connect
                            </Button>
                        </>
                    )}
                </Flex>
            )}

            {/* ── Step 3: Success ── */}
            {step === 'success' && (
                <Flex vertical gap={24} align="center">
                    <Flex vertical gap={16} align="center">
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-full"
                            style={{
                                width: 80,
                                height: 80,
                                backgroundColor: '#f0fdf4',
                                border: '2px solid #bbf7d0',
                            }}
                        >
                            <CheckCircleFilled style={{ fontSize: 40, color: '#22c55e' }} />
                        </Flex>
                        <Flex vertical gap={6} align="center">
                            <Typography.Title
                                level={4}
                                className="!mb-0 !font-semibold text-[#1e293b]"
                            >
                                Connected Successfully!
                            </Typography.Title>
                            <Typography.Text className="text-sm text-[#475569] text-center">
                                Your GST portal session is now active.
                            </Typography.Text>
                            <Typography.Text className="text-xs text-[#94a3b8] text-center">
                                Session valid for 6 hours. You&apos;ll be prompted to reconnect
                                after expiry.
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        block
                        size="large"
                        onClick={() => {
                            if (pendingSession)
                                onConnected(pendingSession.expiresAt, pendingSession.username);
                            handleClose();
                        }}
                        style={{ height: 48, fontSize: 15, fontWeight: 500 }}
                    >
                        Done
                    </Button>
                </Flex>
            )}
        </Modal>
    );
};

export default ConnectGstModal;
