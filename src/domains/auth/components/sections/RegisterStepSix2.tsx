import { useState } from 'react';

import { Button, Flex, Form, Image, Input, Radio, Typography } from 'antd';
import Lottie from 'react-lottie';
import OtpInput from 'react-otp-input';
import { Link } from 'react-router-dom';

import logo from '@assets/mainLogo/standard';
import animation from '@assets/success-animation.json';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { TAB_ID } from '@src/utils/tabId';

import { loginSuccess } from '../../slices/loginSlice';
import { nextStep, resetRegisterState } from '../../slices/registerSlice';

const { Title, Text } = Typography;
const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

const RegisterStepSix = () => {
    const { md } = useScreenSize();
    const [otp, setOtp] = useState('');
    const [documentType, setDocumentType] = useState('pan');
    const [panNumber, setPanNumber] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const dispatch = useAppDispatch();
    const { loginData } = useAppSelector(state => state.reducer.registration);
    const authChannel = new BroadcastChannel('authChannel');

    const handleVerify = () => {
        // Check if OTP has been entered
        if (!otp) {
            return;
        }
        // Proceed if both document number and OTP are entered
        dispatch(nextStep());
    };

    const handleRadioChange = (e: any) => {
        setDocumentType(e.target.value); // Update the state when radio selection changes
    };

    const handleLogin = () => {
        dispatch(loginSuccess({ ...loginData, isAuthenticated: true }));
        authChannel.postMessage({ type: 'login', tabId: TAB_ID });

        dispatch(resetRegisterState());
    };

    return (
        <Flex className="absolute w-full h-screen bg-white">
            {md && (
                <Image
                    src={logo}
                    alt="Logo"
                    preview={false}
                    className="absolute top-6 left-6 hidden md:block"
                    width={120}
                />
            )}
            <Flex
                vertical
                align="center"
                justify="center"
                className="w-25 h-full px-4 space-y-5 max-w-sm mx-auto"
            >
                <Lottie options={defaultOptions} height={100} width={100} />

                <Title level={3} className="text-center">
                    Thanks for the registration
                </Title>

                <Text className="text-center text-gray-600">
                    Now verify your business by using PAN or GST Number.
                </Text>

                <Radio.Group
                    buttonStyle="outline"
                    size="large"
                    defaultValue="pan"
                    onChange={handleRadioChange}
                    className="w-full"
                >
                    <Flex justify="center" className="gap-5">
                        <Radio value="pan">Business PAN</Radio>
                        <Radio value="gst">GST Number</Radio>
                    </Flex>
                </Radio.Group>
                <Form onFinish={handleVerify} className="w-full max-w-md">
                    {documentType === 'pan' && (
                        <Form.Item
                            name="panNumber"
                            rules={[
                                { required: true, message: 'Please enter your PAN' },
                                {
                                    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                                    message: 'Please enter a valid PAN',
                                },
                            ]}
                        >
                            <Input
                                name="panNumber"
                                type="text"
                                placeholder="Enter PAN Number"
                                value={panNumber}
                                onChange={e => setPanNumber(e.target.value)}
                                className="rounded-sm w-full p-3"
                            />
                        </Form.Item>
                    )}

                    {documentType === 'gst' && (
                        <Form.Item
                            name="gstNumber"
                            rules={[
                                { required: true, message: 'Please enter your GST number' },
                                {
                                    pattern: /^[0-9A-Z]{15}$/,
                                    message: 'Please enter a valid GST number',
                                },
                            ]}
                        >
                            <Input
                                name="gstNumber"
                                type="text"
                                placeholder="Enter GST Number"
                                value={gstNumber}
                                onChange={e => setGstNumber(e.target.value)}
                                className="rounded-sm w-full p-3"
                            />
                        </Form.Item>
                    )}
                    <Text className="text-sm text-gray-600 text-center mt-2 mb-2">
                        OTP has been sent to your mobile number +91 9876543210 for verifying your
                        PAN.
                    </Text>

                    <OtpInput
                        containerStyle={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-evenly',
                        }}
                        inputStyle={{
                            width: '48px',
                            height: '48px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '8px',
                            textAlign: 'center',
                        }}
                        value={otp}
                        onChange={setOtp}
                        numInputs={6}
                        renderSeparator={<span>&nbsp; </span>}
                        renderInput={(props, index) => (
                            <input
                                {...props}
                                className={`border border-gray-300 h-14  rounded-md ${
                                     'border-red-500'
                                }`}
                            />
                        )}
                    />

                    <Button
                        onClick={handleVerify}
                        htmlType="submit"
                        type="primary"
                        danger
                        className="mt-5 w-full max-w-md h-11 text-sm"
                    >
                        Verify Now
                    </Button>
                </Form>
                <Link to="" className="mt-3">
                    <Text onClick={() => handleLogin()} className="text-sm text-iconRed underline">
                        Skip
                    </Text>
                </Link>
            </Flex>
        </Flex>
    );
};

export default RegisterStepSix;
