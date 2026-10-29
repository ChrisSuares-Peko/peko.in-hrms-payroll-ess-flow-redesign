import React, { useState, useEffect } from 'react';

import { Button, Typography, Flex, Image, Col, Row } from 'antd';
import OtpInput from 'react-otp-input';
import { useDispatch } from 'react-redux';

import logo from '@assets/mainLogo/Logo.png';
import back from '@assets/Signup/back.svg';
import registerSteps from '@assets/svg/registerSteps.png';
import useScreenSize from '@src/hooks/useScreenSize';

import useOtpApi from '../../hooks/useOtpApi';
import useRegistrationApi from '../../hooks/useRegistrationApi';
import { previousStep } from '../../slices/registerSlice';

const { Text } = Typography;

const StepThree = () => {
    const [otp, setOtp] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [showTimer, setShowTimer] = useState(true);
    const [waCooldown, setWaCooldown] = useState(false);
    const dispatch = useDispatch();
    const { handleSignup, isError, isLoading } = useRegistrationApi();
    const { handleMobileResendOtp } = useOtpApi();
    const { xs } = useScreenSize();

    useEffect(() => {
        let timer: any;
        if (timeRemaining > 0) {
            timer = setTimeout(() => {
                setTimeRemaining(time => time - 1);
            }, 1000);
        } else {
            setShowTimer(false); // Hide timer when it reaches 00:00
            setWaCooldown(false);
        }

        return () => clearTimeout(timer);
    }, [timeRemaining]);

    const handleVerify = async () => {
        await handleSignup(otp);
    };

    const handlePrevious = () => {
        dispatch(previousStep(2));
    };

    const formatTime = (seconds: any) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleResendOTP = (channel?: 'whatsapp') => {
        handleMobileResendOtp(true, channel);
        setTimeRemaining(120);
        setShowTimer(true);
        setWaCooldown(true);
    };

    return (
        <Row className="relative">
            <Col
                xs={{ span: 24, order: 2 }}
                sm={{ span: 24, order: 2 }}
                md={{ span: 24, order: 2 }}
                lg={{ span: 12, order: 1 }}
                xl={{ span: 12, order: 1 }}
                className="flex items-start lg:items-center justify-center min-h-svh px-4 sm:px-8 md:px-10 pt-4"
            >
                <Flex vertical gap={12} className="w-full max-w-[25.75rem]">
                    <Flex align="center" gap={12} className="mb-1">
                        <div className="lg:hidden">
                            <Image
                                src={back}
                                alt="go back"
                                preview={false}
                                width={28}
                                className="cursor-pointer"
                                onClick={handlePrevious}
                            />
                        </div>
                        <Image
                            src={logo}
                            alt="logo"
                            preview={false}
                            className="relative flex -left-2"
                            width={130}
                        />
                    </Flex>
                    <Text className="text-lg font-medium">Verify your Mobile Number</Text>
                    <Text className="text-sm text-gray-600">
                        OTP has been sent to your registered mobile number
                    </Text>

                    <div className="w-full">
                        <OtpInput
                            containerStyle={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                            inputStyle={
                                xs
                                    ? { display: 'inline-flex', flex: 1 }
                                    : {
                                          width: '56px',
                                          height: '56px',
                                          display: 'inline-flex',
                                          justifyContent: 'center',
                                      }
                            }
                            value={otp}
                            onChange={setOtp}
                            numInputs={6}
                            inputType="tel"
                            renderSeparator={<span>&nbsp; </span>}
                            renderInput={(props, index) => (
                                <input
                                    {...props}
                                    type="password"
                                    className={`w-12 h-12 sm:w-10 sm:h-16 text-center text-lg border border-gray-300 rounded-md otpInput ${
                                        isError ? 'border-red-500' : ''
                                    }`}
                                    onPaste={e => {
                                        e.preventDefault();
                                        const digits = e.clipboardData
                                            .getData('text/plain')
                                            .replace(/\D/g, '')
                                            .slice(0, 6);
                                        if (digits) setOtp(digits);
                                    }}
                                />
                            )}
                        />
                    </div>

                    <Button
                        onClick={handleVerify}
                        htmlType="submit"
                        type="primary"
                        danger
                        loading={isLoading}
                        className="w-full font-semibold"
                    >
                        Verify and Submit
                    </Button>

                    <Flex justify="space-between" align="end" className="w-full" gap={16}>
                        {!waCooldown ? (
                            <Text
                                onClick={() => handleResendOTP('whatsapp')}
                                style={{ color: 'red', cursor: 'pointer' }}
                            >
                                Send OTP via WhatsApp
                            </Text>
                        ) : (
                            <span />
                        )}
                        {showTimer ? (
                            <Text className="text-green-500">
                                Time Remaining: {formatTime(timeRemaining)}
                            </Text>
                        ) : (
                            <Text
                                onClick={() => handleResendOTP()}
                                style={{ color: 'red', cursor: 'pointer' }}
                            >
                                Resend OTP
                            </Text>
                        )}
                    </Flex>

                    <Flex align="center" justify="center" className="hidden pt-2 lg:flex">
                        <Text
                            onClick={handlePrevious}
                            className="text-red-500 underline cursor-pointer text"
                        >
                            Go Back
                        </Text>
                    </Flex>
                </Flex>
            </Col>
            <Col
                xs={{ span: 0, order: 1 }}
                sm={{ span: 0, order: 1 }}
                md={{ span: 0, order: 1 }}
                lg={{ span: 12, order: 2 }}
                xl={{ span: 12, order: 2 }}
            >
                <Flex
                    className="h-[55vh] md:h-svh flex"
                    style={{
                        backgroundImage: `url(${registerSteps})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-transparent to-black bg-opacity-80 " />
                    <Text className="text-sm md:text-3xl xxl:text-4xl text-white px-10 md:px-6 pb-5 font-light self-end p-0 md:p-10 max-w-[19rem] sm:max-w-4xl z-10 xxl:leading-[56px] md:leading-[40px] ">
                        All-in-one platform for SMBs to manage all their payments, expenses, travel,
                        insurance, and automate operations
                    </Text>
                </Flex>
            </Col>
        </Row>
    );
};

export default StepThree;
