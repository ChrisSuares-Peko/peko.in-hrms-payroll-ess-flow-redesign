import { useEffect, useRef, useState } from 'react';

import { Button, Flex, Modal, Typography, message } from 'antd';
import { Formik, FormikProps } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { sendBankPhoneOtp } from '../api';

interface Props {
    open: boolean;
    phone: string;
    onConfirm: (otp: string) => void;
    onCancel: () => void;
}

interface OtpFormValues {
    otp0: string;
    otp1: string;
    otp2: string;
    otp3: string;
    otp4: string;
    otp5: string;
}

const EMPTY_OTP: OtpFormValues = {
    otp0: '',
    otp1: '',
    otp2: '',
    otp3: '',
    otp4: '',
    otp5: '',
};

const OTP_INDICES = [0, 1, 2, 3, 4, 5] as const;
const RESEND_SECONDS = 120;

const focusOtpBox = (idx: number) => {
    const el = document.querySelector<HTMLInputElement>(`input[name="otp${idx}"]`);
    el?.focus();
    el?.select();
};

const BankPhoneOtpModal = ({ open, phone, onConfirm, onCancel }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
    const [sending, setSending] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const formikRef = useRef<FormikProps<OtpFormValues> | null>(null);

    const fireSend = async () => {
        if (!phone) return;
        setSending(true);
        setErrorMsg('');
        const resp = await sendBankPhoneOtp({ userId: id, userType: role, phone });
        setSending(false);
        if (!resp?.status) {
            setErrorMsg(resp?.message || 'Failed to send OTP');
            return;
        }
        message.success(`OTP sent to ${  phone}`);
        setSecondsLeft(RESEND_SECONDS);
    };

    useEffect(() => {
        if (open) {
            setErrorMsg('');
            formikRef.current?.resetForm({ values: EMPTY_OTP });
            fireSend();
            setTimeout(() => focusOtpBox(0), 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, phone]);

    useEffect(() => {
        if (!open || secondsLeft <= 0) {
            return undefined;
        }
        const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [open, secondsLeft]);

    const formattedTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
        secondsLeft % 60
    ).padStart(2, '0')}`;

    const combinedOtp = (v: OtpFormValues) => OTP_INDICES.map(i => v[`otp${i}` as keyof OtpFormValues]).join('');

    const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const target = e.target as HTMLInputElement;
        const match = target?.name?.match(/^otp(\d)$/);
        if (!match) return;
        const idx = parseInt(match[1], 10);
        if (e.key === 'Backspace' && !target.value && idx > 0) {
            focusOtpBox(idx - 1);
        } else if (e.key === 'ArrowLeft' && idx > 0) {
            focusOtpBox(idx - 1);
        } else if (e.key === 'ArrowRight' && idx < 5) {
            focusOtpBox(idx + 1);
        }
    };

    const handleContainerPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData?.getData('text') || '';
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 0) return;
        e.preventDefault();
        const fk = formikRef.current;
        if (!fk) return;
        OTP_INDICES.forEach(i => {
            fk.setFieldValue(`otp${i}`, digits[i] || '');
        });
        focusOtpBox(Math.min(digits.length, 5));
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            destroyOnClose
            title="Verify Phone Number"
            width={420}
        >
            <Formik<OtpFormValues>
                innerRef={formikRef}
                initialValues={EMPTY_OTP}
                onSubmit={values => {
                    const otp = combinedOtp(values);
                    if (otp.length === 6) onConfirm(otp);
                }}
            >
                {({ values, handleSubmit }) => {
                    const otp = combinedOtp(values);
                    return (
                        <Flex vertical gap={16} className="pt-2">
                            <Typography.Text className="text-[13px] text-[#475467]">
                                We have sent a 6-digit OTP to{' '}
                                <span className="font-semibold text-[#1F2A44]">+91 {phone}</span>.
                                Please enter it below to verify this number.
                            </Typography.Text>

                            <Flex
                                gap={8}
                                justify="center"
                                onKeyDown={handleContainerKeyDown}
                                onPaste={handleContainerPaste}
                            >
                                {OTP_INDICES.map(i => (
                                    <div key={i} style={{ width: 44 }}>
                                        <TextInput
                                            name={`otp${i}`}
                                            type="text"
                                            values={values[`otp${i}` as keyof OtpFormValues]}
                                            allowNumbersOnly
                                            maxLength={1}
                                            inputMode="numeric"
                                            formItemClass="!mb-0"
                                            classes="!h-12 !rounded-lg !text-[18px] !text-center !font-semibold"
                                            handleChange={v => {
                                                if (v && i < 5) focusOtpBox(i + 1);
                                            }}
                                        />
                                    </div>
                                ))}
                            </Flex>

                            {errorMsg && (
                                <Typography.Text className="text-[12px] text-[#D92D20] text-center">
                                    {errorMsg}
                                </Typography.Text>
                            )}

                            <Flex justify="center" align="center" gap={6}>
                                {secondsLeft > 0 ? (
                                    <Typography.Text className="text-[12px] text-[#667085]">
                                        Resend OTP in {formattedTimer}
                                    </Typography.Text>
                                ) : (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={fireSend}
                                        loading={sending}
                                        className="!p-0 !text-[12px]"
                                    >
                                        Resend OTP
                                    </Button>
                                )}
                            </Flex>

                            <Flex justify="flex-end" gap={8} className="pt-2">
                                <Button
                                    onClick={onCancel}
                                    className="!h-9 !px-5 !text-[13px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    disabled={otp.length !== 6 || sending}
                                    onClick={() => handleSubmit()}
                                    className="!h-9 !px-5 !text-[13px] !font-medium"
                                >
                                    Confirm
                                </Button>
                            </Flex>
                        </Flex>
                    );
                }}
            </Formik>
        </Modal>
    );
};

export default BankPhoneOtpModal;
