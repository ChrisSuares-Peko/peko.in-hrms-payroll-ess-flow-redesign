import { useEffect, useRef, useState } from 'react';

import {
    CopyOutlined,
    ExclamationCircleOutlined,
    EyeInvisibleOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { Button, Flex, Input, Modal, Typography } from 'antd';

import { MyCard } from '../../../utils/types';

const { Title, Text } = Typography;

type Step = 'hidden' | 'otp' | 'revealed';

const MASKED_PHONE = '+91 •••• ••59';
const MOCK_CARD_NUMBER = '4043 2937 3831 9012';
const MOCK_EXPIRY = '12/2026';
const MOCK_CVV = '404';
const AUTO_HIDE_SECONDS = 10;
const OTP_TIMER_SECONDS = 85;

interface CardDetailsModalProps {
    card: MyCard | null;
    onClose: () => void;
}

const CardDetailsModal = ({ card, onClose }: CardDetailsModalProps) => {
    const [step, setStep] = useState<Step>('hidden');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(OTP_TIMER_SECONDS);
    const [hideTimer, setHideTimer] = useState(AUTO_HIDE_SECONDS);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (step !== 'otp') return undefined;
        setOtpTimer(OTP_TIMER_SECONDS);
        const id = setInterval(() => setOtpTimer(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(id);
    }, [step]);

    useEffect(() => {
        if (step !== 'revealed') return undefined;
        setHideTimer(AUTO_HIDE_SECONDS);
        const id = setInterval(() => setHideTimer(prev => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(id);
    }, [step]);

    useEffect(() => {
        if (step === 'revealed' && hideTimer === 0) onClose();
    }, [hideTimer, step, onClose]);

    const formatTimer = (secs: number) =>
        `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

    const handleOtpChange = (value: string, index: number) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        setOtp(prev => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const copy = (text: string) => navigator.clipboard.writeText(text);

    const modalTitle = (
        <Flex vertical gap={2}>
            <Title level={5} className="!mb-0 !text-textHeadings">
                Card details · ••••{card?.last4}
            </Title>
            <Text className="text-sm font-normal text-textGreyLight">
                {card?.nameOnCard || card?.holder} · {card?.kind}
            </Text>
        </Flex>
    );

    return (
        <Modal
            open={card !== null}
            onCancel={onClose}
            footer={null}
            title={modalTitle}
            width={480}
            destroyOnHidden
        >
            {step === 'hidden' && (
                <Flex vertical gap={24} className="mt-2">
                    <Flex vertical gap={12} className="rounded-xl bg-bgGray p-4">
                        <Flex gap={8} align="center">
                            <ExclamationCircleOutlined className="text-textOrange" />
                            <Text className="font-semibold text-textHeadings">
                                Details are hidden
                            </Text>
                        </Flex>
                        <Text className="text-sm text-textBody">
                            For your security, the full card number, expiry and CVV are masked.
                            We&apos;ll send a one-time password (OTP) to your registered phone
                            number to reveal them.
                        </Text>
                        <Flex
                            gap={8}
                            align="center"
                            className="rounded-lg border border-borderCard bg-white px-3 py-2"
                        >
                            <PhoneOutlined className="text-textBody" />
                            <Text className="text-sm text-textBody">{MASKED_PHONE}</Text>
                        </Flex>
                    </Flex>
                    <Flex gap={12}>
                        <Button block danger onClick={onClose}>
                            Cancel
                        </Button>
                        <Button block type="primary" danger onClick={() => setStep('otp')}>
                            Send OTP
                        </Button>
                    </Flex>
                </Flex>
            )}

            {step === 'otp' && (
                <Flex vertical gap={20} className="mt-2">
                    <Text className="text-center text-sm text-textBody">
                        Enter the 6-digit code sent to {MASKED_PHONE}.
                    </Text>
                    <Flex gap={8} justify="center">
                        {otp.map((digit, i) => (
                            <Input
                                key={i}
                                ref={el => {
                                    inputRefs.current[i] = el?.input ?? null;
                                }}
                                value={digit}
                                onChange={e => handleOtpChange(e.target.value, i)}
                                onKeyDown={e => handleOtpKeyDown(e, i)}
                                maxLength={1}
                                className="!h-12 !w-10 text-center text-lg font-semibold"
                            />
                        ))}
                    </Flex>
                    <Flex justify="space-between" align="center">
                        <Text className="text-sm text-savingsTagLightText">
                            Time Remaining: {formatTimer(otpTimer)}
                        </Text>
                        <Button
                            type="link"
                            danger
                            className="!p-0"
                            onClick={() => setOtpTimer(OTP_TIMER_SECONDS)}
                        >
                            Resend OTP
                        </Button>
                    </Flex>
                    <Flex gap={12}>
                        <Button block danger onClick={() => setStep('hidden')}>
                            Back
                        </Button>
                        <Button block type="primary" danger onClick={() => setStep('revealed')}>
                            Verify &amp; reveal
                        </Button>
                    </Flex>
                </Flex>
            )}

            {step === 'revealed' && (
                <Flex vertical gap={16} className="mt-2">
                    <Flex
                        align="center"
                        justify="space-between"
                        className="rounded-xl bg-bgGray px-4 py-3"
                    >
                        <Flex vertical gap={2}>
                            <Text className="text-xs text-textGreyLight">Card number</Text>
                            <Text className="text-base font-medium text-textHeadings">
                                {MOCK_CARD_NUMBER}
                            </Text>
                        </Flex>
                        <Button
                            type="text"
                            icon={<CopyOutlined className="!text-brandColor" />}
                            onClick={() => copy(MOCK_CARD_NUMBER)}
                        />
                    </Flex>
                    <Flex gap={12}>
                        <Flex
                            flex={1}
                            align="center"
                            justify="space-between"
                            className="rounded-xl bg-bgGray px-4 py-3"
                        >
                            <Flex vertical gap={2}>
                                <Text className="text-xs text-textGreyLight">Expiry</Text>
                                <Text className="text-base font-medium text-textHeadings">
                                    {MOCK_EXPIRY}
                                </Text>
                            </Flex>
                            <Button
                                type="text"
                                icon={<CopyOutlined className="!text-brandColor" />}
                                onClick={() => copy(MOCK_EXPIRY)}
                            />
                        </Flex>
                        <Flex
                            flex={1}
                            align="center"
                            justify="space-between"
                            className="rounded-xl bg-bgGray px-4 py-3"
                        >
                            <Flex vertical gap={2}>
                                <Text className="text-xs text-textGreyLight">CVV</Text>
                                <Text className="text-base font-medium text-textHeadings">
                                    {MOCK_CVV}
                                </Text>
                            </Flex>
                            <Button
                                type="text"
                                icon={<CopyOutlined className="!text-brandColor" />}
                                onClick={() => copy(MOCK_CVV)}
                            />
                        </Flex>
                    </Flex>
                    <Flex gap={8} align="center">
                        <EyeInvisibleOutlined className="text-textGreyLight" />
                        <Text className="text-xs text-textGreyLight">
                            Auto-hides in {hideTimer}s. Never share these details with anyone
                        </Text>
                    </Flex>
                    <Button block danger icon={<EyeInvisibleOutlined />} onClick={onClose}>
                        Hide
                    </Button>
                </Flex>
            )}
        </Modal>
    );
};

export default CardDetailsModal;
