import { useEffect, useState } from 'react';

import { Button, Flex, Modal, Typography } from 'antd';
import OTPInput from 'react-otp-input';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface OtpModalProps {
    isOpen: boolean;
    handleCancel: () => void;
    title: string;
    handleSubmit: (otp: string) => void;
    isLoading: boolean;
    onResend?: () => void | Promise<any>;
    isOtpSending?: boolean;
    zIndex?: number;
}
const CancelOtpModal = ({
    isOpen,
    handleCancel,
    title,
    handleSubmit,
    isLoading,
    onResend,
    isOtpSending,
    zIndex,
}: OtpModalProps) => {
    const [otp, setOtp] = useState('');
    const [resendDisabled, setResendDisabled] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (timeRemaining > 0) {
                setTimeRemaining(time => time - 1);
            } else {
                setResendDisabled(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeRemaining]);

    const handleResendClick = async () => {
        if (onResend && !resendDisabled) {
            setOtp('');
            onResend();
            setResendDisabled(true);
            setTimeRemaining(120);
            dispatch(showToast({ description: 'OTP sent successfully.', variant: 'success' }));
        }
    };

    useEffect(() => {
        setOtp('');
        setResendDisabled(true);
        setTimeRemaining(120);
        if (!isOpen) {
            setTimeRemaining(0);
        }
    }, [isOpen]);

    const formatTime = (seconds: any) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Modal
            title={title}
            open={isOpen}
            onCancel={handleCancel}
            closeIcon={null}
            centered
            style={{ padding: 10 }}
            zIndex={zIndex}
            maskClosable={false}
            footer={[
                <Flex className=" w-full" justify="flex-end" gap={10} key="">
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={isLoading}
                        onClick={() => {
                            if (otp.length < 6) {
                                dispatch(
                                    showToast({
                                        description: 'Please enter a valid OTP',
                                        variant: 'warning',
                                    })
                                );
                                return;
                            }
                            handleSubmit(otp);
                        }}
                        className=" "
                    >
                        Verify
                    </Button>
                    <Button key="back" onClick={handleCancel} className="  ">
                        Cancel
                    </Button>
                </Flex>,
            ]}
        >
            <Typography.Text className=" text-xs font-normal text-gray-800  ">
                OTP has been sent to your registered email address.
            </Typography.Text>
            <OTPInput
                containerStyle={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                }}
                inputStyle={{
                    display: 'inline-flex',
                    flex: 1,
                }}
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderSeparator={<span>&nbsp; </span>}
                renderInput={(props, index) => (
                    <input
                        {...props}
                        type="password"
                        className="w-12 h-11 sm:w-10 sm:h-16 border border-gray-300 rounded-lg otpInput"
                    />
                )}
            />

            {isOtpSending ? (
                <Flex className="my-4" gap={10}>
                    <Typography.Text className=" text-sm font-normal underline   text-textDisabledGray cursor-not-allowed">
                        Sending ...
                    </Typography.Text>
                </Flex>
            ) : (
                <Flex className="my-4" justify="flex-end" align="center" gap={10}>
                    {resendDisabled ? (
                        <Typography.Text className="text-sm font-normal text-green-500">
                            Time Remaining: {formatTime(timeRemaining)}
                        </Typography.Text>
                    ) : (
                        <Typography.Text
                            className="text-sm font-normal underline cursor-pointer text-gray-800"
                            onClick={handleResendClick}
                        >
                            Resend OTP
                        </Typography.Text>
                    )}
                </Flex>
            )}
        </Modal>
    );
};

export default CancelOtpModal;
