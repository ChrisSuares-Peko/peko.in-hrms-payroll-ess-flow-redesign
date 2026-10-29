import React, { useCallback } from 'react';

import { Button, Col, Flex, Form, Row, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import TextInput from '@components/atomic/inputs/TextInput';
import { paths } from '@src/routes/paths';

import KYBSteps from '../../components/kyb/KYBSteps';

const KybPage = () => {
    const navigate = useNavigate();

    const handleGoBack = useCallback(() => {
        navigate(`/${paths.invoice.index}`);
    }, [navigate]);

    return (
        <Flex vertical className="w-full" align="center" gap={15}>
            <Skeleton active>
                <Typography.Text className="text-xl font-medium">
                    Let’s help activate your payment link
                </Typography.Text>
                <Typography.Text className="text-xm">
                    Complete your KYB verification to activate payment links in just 48 hours
                </Typography.Text>
                <KYBSteps current={0} />

                <Formik
                    initialValues={{
                        signerName: '',
                        email: '',
                    }}
                    // Assume a basic validation schema or a custom one for this form
                    onSubmit={values => {
                        console.log('Form values:', values);
                    }}
                >
                    {({ handleSubmit }) => (
                        <Form layout="vertical" onFinish={handleSubmit} className="w-full xl:w-2/3">
                            <Flex className="" vertical>
                                <Typography.Text className="text-lg font-medium">
                                    Signer Details
                                </Typography.Text>

                                <Row
                                    gutter={{ xs: 8, sm: 16, md: 24, lg: 20 }}
                                    className="flex-col sm:flex-row sm:mt-6"
                                >
                                    <Col xs={24} sm={12}>
                                        <TextInput
                                            name="signerName"
                                            label="Signer’s Name"
                                            placeholder="Enter signer’s name"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput
                                            name="email"
                                            label="Enter Email ID"
                                            placeholder="Enter email"
                                            type="email"
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                            </Flex>

                            <Flex gap={10} className="mt-4">
                                <Button
                                    htmlType="submit"
                                    type="primary"
                                    danger
                                    className="px-8 w-36"
                                >
                                    Next
                                </Button>
                                <Button danger className="px-8 w-36" onClick={handleGoBack}>
                                    I will do it later
                                </Button>
                            </Flex>
                        </Form>
                    )}
                </Formik>
            </Skeleton>
        </Flex>
    );
};

export default KybPage;
