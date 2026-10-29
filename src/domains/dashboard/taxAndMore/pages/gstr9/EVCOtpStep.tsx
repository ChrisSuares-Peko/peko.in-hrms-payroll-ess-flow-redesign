import { useEffect, useRef, useState } from 'react';

import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Button, Divider, Flex, Input, InputRef, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

type EVCState = 'pan-input' | 'otp-input';

const formatTime = (s: number) =>
    `${Math.floor(s / 60)
        .toString()
        .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const maskPan = (pan: string) => {
    if (!pan || pan.length < 4) return pan;
    return `${pan.slice(0, 2)}XXX XXXX ${pan.slice(-4).toUpperCase()}`;
};

// ─── State 1: PAN form ────────────────────────────────────────────────────────

const PanForm = ({
    pan,
    onPanChange,
    onSend,
    onBack,
    loading,
}: {
    pan: string;
    onPanChange: (v: string) => void;
    onSend: () => void;
    onBack: () => void;
    loading: boolean;
}) => (
    <div className="border mt-2 border-[#e2e8f0] rounded-[14px] bg-white overflow-hidden">
        {/* Heading */}
        <div className="px-6 pt-5 pb-4">
            <Typography.Text className="font-bold" style={{ fontSize: 16, color: '#1e293b' }}>
                Generate EVC OTP &amp; File GSTR-9
            </Typography.Text>
        </div>

        <div className="px-6 pb-6">
            {/* Warning */}
            <Flex
                gap={8}
                align="flex-start"
                className="border border-[#fef3c7] rounded-xl px-4 py-3 mb-5"
                style={{ background: '#fffbeb' }}
            >
                <WarningFilled
                    style={{ color: '#d97706', fontSize: 14, marginTop: 2, flexShrink: 0 }}
                />
                <div>
                    <Typography.Text
                        className="font-semibold text-sm block"
                        style={{ color: '#92400e' }}
                    >
                        Final Irreversible Action
                    </Typography.Text>
                    <Typography.Text className="text-xs" style={{ color: '#92400e' }}>
                        GSTR-9 once filed cannot be revised.
                    </Typography.Text>
                </div>
            </Flex>

            {/* PAN field */}
            <div>
                <Typography.Text
                    className="font-medium text-sm block mb-2"
                    style={{ color: '#1e293b' }}
                >
                    Authorized Signatory PAN <span style={{ color: '#ef4444' }}>*</span>
                </Typography.Text>
                <Input
                    className="mt-2"
                    placeholder="Enter PAN"
                    value={pan}
                    onChange={e =>
                        onPanChange(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase())
                    }
                    maxLength={10}
                    style={{ borderRadius: 10, height: 44 }}
                />
            </div>
        </div>

        <Divider className="m-0" />
        <Flex justify="space-between" wrap="wrap" gap={8} className="px-6 py-4">
            <Button icon={<ArrowLeftOutlined />} style={{ height: 40 }} onClick={onBack}>
                Back
            </Button>
            <Button
                type="primary"
                danger
                loading={loading}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                style={{ height: 40 }}
                disabled={pan.length < 10}
                onClick={onSend}
            >
                Send EVC OTP to Registered Mobile
            </Button>
        </Flex>
    </div>
);

// ─── State 2: OTP form ────────────────────────────────────────────────────────

const OtpForm = ({
    pan,
    otp,
    onOtpChange,
    onKeyDown,
    otpRefs,
    onResend,
    onFile,
    onBack,
    isFiling,
    resendTimer,
    isResending,
}: {
    pan: string;
    otp: string[];
    onOtpChange: (i: number, v: string) => void;
    onKeyDown: (i: number, e: React.KeyboardEvent) => void;
    otpRefs: React.MutableRefObject<Array<InputRef | null>>;
    onResend: () => void;
    onFile: () => void;
    onBack: () => void;
    isFiling: boolean;
    resendTimer: number;
    isResending: boolean;
}) => (
    <div className="border mt-2 border-[#e2e8f0] rounded-[14px] bg-white overflow-hidden">
        {/* Heading */}
        <div className="px-6 pt-5 pb-1">
            <Typography.Text className="font-bold" style={{ fontSize: 16, color: '#1e293b' }}>
                Generate EVC OTP &amp; File GSTR-9
            </Typography.Text>
        </div>

        <div>
            {/* Info card */}
            <Flex
                gap={8}
                align="center"
                className="border border-[#e2e8f0] rounded-xl px-4 py-3 mx-6 mt-4"
                style={{ background: '#f8fafc' }}
            >
                <InfoCircleOutlined style={{ color: '#64748b', fontSize: 13, flexShrink: 0 }} />
                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                    OTP sent to registered mobile <strong>+91 98XXX XXXX67</strong>
                </Typography.Text>
            </Flex>

            <Flex vertical align="center" gap={24} className="px-6 py-10">
                {/* Masked PAN */}
                <div style={{ maxWidth: 260, width: '100%' }}>
                    <Typography.Text
                        className="text-sm font-medium block mb-2 text-center"
                        style={{ color: '#475569' }}
                    >
                        Authorized Signatory PAN
                    </Typography.Text>
                    <div
                        className="text-center mt-1 rounded-xl px-4 py-3 border border-[#e2e8f0]"
                        style={{ background: '#f1f5f9', letterSpacing: 2 }}
                    >
                        <Typography.Text
                            className="font-semibold text-sm"
                            style={{ color: '#1e293b' }}
                        >
                            {maskPan(pan)}
                        </Typography.Text>
                    </div>
                </div>

                {/* OTP boxes */}
                <div>
                    <Typography.Text
                        className="text-sm font-medium block mb-3 text-center"
                        style={{ color: '#1e293b' }}
                    >
                        Enter 6-digit EVC OTP
                    </Typography.Text>
                    <Flex gap={8} className="mt-3" justify="center" wrap="wrap">
                        {otp.map((digit, i) => (
                            <Input
                                key={i}
                                ref={el => {
                                    otpRefs.current[i] = el;
                                }}
                                maxLength={1}
                                value={digit}
                                onChange={e => onOtpChange(i, e.target.value)}
                                onKeyDown={e => onKeyDown(i, e)}
                                style={{
                                    width: 52,
                                    height: 52,
                                    textAlign: 'center',
                                    fontSize: 20,
                                    fontWeight: 600,
                                    borderRadius: 10,
                                    padding: 0,
                                }}
                            />
                        ))}
                    </Flex>
                </div>

                {/* Resend */}
                {resendTimer > 0 ? (
                    <Typography.Text className="text-sm font-medium" style={{ color: '#22c55e' }}>
                        Time Remaining: {formatTime(resendTimer)}
                    </Typography.Text>
                ) : (
                    <Typography.Text
                        className="text-sm underline"
                        style={{
                            color: isResending ? '#94a3b8' : '#1e293b',
                            cursor: isResending ? 'default' : 'pointer',
                        }}
                        onClick={isResending ? undefined : onResend}
                    >
                        {isResending ? (
                            <LoadingOutlined style={{ fontSize: 12, marginRight: 4 }} />
                        ) : null}
                        Resend OTP
                    </Typography.Text>
                )}
            </Flex>
        </div>

        <Divider className="m-0" />
        <Flex justify="space-between" wrap="wrap" gap={8} className="px-6 py-4">
            <Button icon={<ArrowLeftOutlined />} style={{ height: 40 }} onClick={onBack}>
                Back
            </Button>
            <Button
                type="primary"
                danger
                loading={isFiling}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                style={{ height: 40 }}
                disabled={otp.some(d => !d)}
                onClick={onFile}
            >
                File Annual Return (GSTR-9)
            </Button>
        </Flex>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const EVCOtpStep = ({
    onBack,
    onNext,
    isGeneratingOtp,
    onGenerateOtp,
    isFiling,
    onFile,
}: {
    onBack: () => void;
    onNext: () => void;
    isGeneratingOtp: boolean;
    onGenerateOtp: (pan: string) => Promise<boolean>;
    isFiling: boolean;
    onFile: (pan: string, otp: string) => Promise<boolean>;
}) => {
    const dispatch = useAppDispatch();
    const [evcState, setEvcState] = useState<EVCState>('pan-input');
    const [pan, setPan] = useState('');
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
    const otpRefs = useRef<Array<InputRef | null>>(Array(6).fill(null));
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (resendTimer <= 0) return undefined;
        const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [resendTimer]);

    const handleOtpChange = (i: number, val: string) => {
        const digit = val.replace(/\D/g, '').slice(-1);
        setOtp(prev => {
            const next = [...prev];
            next[i] = digit;
            return next;
        });
        if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            otpRefs.current[i - 1]?.focus();
        }
    };

    const handleSendOtp = async () => {
        const ok = await onGenerateOtp(pan);
        if (ok) {
            setEvcState('otp-input');
            setResendTimer(120);
            dispatch(showToast({ description: 'OTP sent successfully.', variant: 'success' }));
        }
    };

    const handleResend = async () => {
        setOtp(Array(6).fill(''));
        setIsResending(true);
        const ok = await onGenerateOtp(pan);
        setIsResending(false);
        if (ok) {
            setResendTimer(120);
            dispatch(showToast({ description: 'OTP sent successfully.', variant: 'success' }));
        }
    };

    const handleFile = async () => {
        const ok = await onFile(pan, otp.join(''));
        if (ok) onNext();
    };

    return (
        <Flex vertical gap={16}>
            {evcState === 'pan-input' ? (
                <PanForm
                    pan={pan}
                    onPanChange={setPan}
                    onSend={handleSendOtp}
                    onBack={onBack}
                    loading={isGeneratingOtp}
                />
            ) : (
                <OtpForm
                    pan={pan}
                    otp={otp}
                    onOtpChange={handleOtpChange}
                    onKeyDown={handleKeyDown}
                    otpRefs={otpRefs}
                    onResend={handleResend}
                    onFile={handleFile}
                    onBack={() => setEvcState('pan-input')}
                    isFiling={isFiling}
                    resendTimer={resendTimer}
                    isResending={isResending}
                />
            )}
        </Flex>
    );
};

export default EVCOtpStep;
