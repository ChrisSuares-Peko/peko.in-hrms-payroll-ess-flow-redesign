import React from 'react';

import { Typography, Flex, Image, Row, Col } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/Logo.png';
import back from '@assets/Signup/back.svg';
import registerSteps from '@assets/svg/registerSteps.png';
import { useAppDispatch } from '@src/hooks/store';

import { previousStep } from '../../slices/registerSlice';
import RegisterStepOneForm from '../forms/RegisterStepOneForm';

const { Text } = Typography;

const StepOne = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleBack = () => {
        dispatch(previousStep(1));
    };

    return (
        <Row className="relative">
            <Row className="w-full" justify="center" align="middle">
                <Col
                    xs={{ span: 24, order: 2 }}
                    sm={{ span: 24, order: 2 }}
                    md={{ span: 24, order: 2 }}
                    lg={{ span: 12, order: 1 }}
                    xl={{ span: 12, order: 1 }}
                    className="relative flex items-start lg:items-center justify-center min-h-svh px-4 sm:px-8 md:px-10 pt-4"
                >
                    <Flex
                        vertical
                        justify="center"
                        align="start"
                        className="w-full max-w-[25.75rem]"
                    >
                        <Flex align="center" gap={12} className="mb-1">
                            <div className="lg:hidden">
                                <Image
                                    src={back}
                                    alt="go back"
                                    preview={false}
                                    width={28}
                                    className="cursor-pointer"
                                    onClick={handleBack}
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
                        <Text className="mt-1 text-xl font-normal">Let’s get started for free</Text>
                        <RegisterStepOneForm />
                        <Col className="mt-6 border-b-[.3px] w-full border-textInfoGrey" />
                        <Text className="flex items-center justify-center w-full mt-4 text-sm text-textBlack">
                            Already have an account?
                            <Text
                                className="inline-flex items-center text-sm font-semibold text-red-500 underline cursor-pointer ms-1"
                                onClick={() => navigate('/auth/login')}
                            >
                                <span>Sign in</span> <GoArrowUpRight />
                            </Text>
                        </Text>
                        <Flex align="center" justify="center" className="hidden w-full pt-2 lg:flex">
                            <Text onClick={handleBack} className="underline cursor-pointer text-iconRed">
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
                        className="h-[50vh] md:h-svh flex"
                        style={{
                            backgroundImage: `url(${registerSteps})`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-transparent to-black/70 " />
                        <Text className=" text-sm md:text-3xl xxl:text-4xl text-white px-4 pb-5 font-light self-end p-0 md:p-10 max-w-[19rem] sm:max-w-4xl z-10 xxl:leading-[56px] md:leading-[40px]">
                            All-in-one platform for SMBs to manage all their payments, expenses,
                            travel, insurance, and automate operations
                        </Text>
                    </Flex>
                </Col>
            </Row>
        </Row>
    );
};
export default StepOne;
