import React from 'react';

import { Typography, Flex, Image, Col, Row } from 'antd';

// import { AiOutlineLeftCircle } from 'react-icons/ai';

import logo from '@assets/mainLogo/standard';
import back from '@assets/Signup/back.svg';
import registerSteps from '@assets/svg/registerSteps.png';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import RegisterStepFive from './RegisterStepFive';
import { nextStep, previousStep } from '../../slices/registerSlice';

const { Text } = Typography;


const RegisterVerification = () => {
    const dispatch = useAppDispatch();
    const { signupType } = useAppSelector(state => state.reducer.registration);
    const isFreelancer = signupType === 'FREELANCER';

    const handlePrevious = () => {
        dispatch(previousStep());
    };
  return (
    <Row className="relative">
            {/* <Flex className="absolute hidden md:inline-block top-3 left-10">
                <Image src={logoicon} alt="icon" />
            </Flex> */}
            <Row className="w-full">
                <Col
                    xs={{ span: 24, order: 2 }}
                    sm={{ span: 24, order: 2 }}
                    md={{ span: 24, order: 2 }}
                    lg={{ span: 12, order: 1 }}
                    xl={{ span: 12, order: 1 }}
                    className="flex items-start lg:items-center justify-center min-h-svh px-4 sm:px-8 md:px-10 pt-4"
                >
                    <Flex vertical gap={8} className="w-full max-w-[25.75rem]">
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
                                width={185}
                            />
                        </Flex>
                        <Text className="text-lg font-medium -mt-1">
                            {isFreelancer ? 'Provide PAN Information' : 'Provide PAN and GST Information'}
                        </Text>
                        <Text type='secondary' className="text-xs">Enter your details to get started</Text>

                        <RegisterStepFive panOnly={isFreelancer} />

                        <Flex
                            align="center"
                            justify="center"
                            gap={5}
                            className="hidden md:flex md:items-center md:justify-center md:pt-4 md:gap-1"
                        >
                            {/* <AiOutlineLeftCircle className="text-2xl text-gray-400 " /> */}
                            <Typography.Text
                                 onClick={() => dispatch(nextStep())}
                                className="underline cursor-pointer text-iconRed"
                            >
                               Skip for now
                            </Typography.Text>
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
                        <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-transparent to-black/80 " />
                        <Text className="text-sm md:text-3xl xxl:text-4xl text-white px-4 pb-5 font-light self-end p-0 md:p-10 max-w-[19rem] sm:max-w-4xl z-10 xxl:leading-[56px] md:leading-[40px] ">
                            All-in-one platform for SMBs to manage all their payments, expenses,
                            travel, insurance, and automate operations
                        </Text>
                    </Flex>
                </Col>
            </Row>
        </Row>
  )
}

export default RegisterVerification