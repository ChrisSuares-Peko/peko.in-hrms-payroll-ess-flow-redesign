import React from 'react';

import { Form, Row, Col, Select, Flex, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { ReceiverDetailsSchema } from '../schema/ReceiverDetailsSchema';

type Props = {
    formRef: React.MutableRefObject<any>;
    handleContactSubmit: (values: object) => void;
    phoneCodes: any[];
};

const PassengerSelectionForm = ({ formRef, handleContactSubmit, phoneCodes }: Props) => (
        <Formik
            initialValues={{
                phone: '',
                email: '',
            }}
            validationSchema={ReceiverDetailsSchema}
            innerRef={formRef}
            onSubmit={values => {
                handleContactSubmit(values);
            }}
        >
            {({ handleSubmit, handleChange }) => (
                <Form onFinish={handleSubmit} layout="horizontal">
                    <Flex className="mb-5 mt-5">
                        <Typography.Text className="mb-5">
                            <span style={{ color: 'lightRed' }} className="text-lightRed ">
                                *
                            </span>{' '}
                            Mobile Number
                        </Typography.Text>
                    </Flex>
                    <Row gutter={8}>
                        {/* <Col xs={24}> */}
                        <Col xs={8} className="w-full">
                            <Select
                                showSearch
                                options={phoneCodes ?? []}
                                placeholder="Country Code"
                                defaultValue="+971"
                                onSelect={e => handleChange('phoneCode')(e)}
                                className="border-r-0 w-full"
                                filterOption={(input: string, option) =>
                                    (option?.label ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                // style={{ maxWidth: '100%' }}
                                // style={{ width: '110px' }}
                            />
                        </Col>
                        <Col xs={16}>
                            <TextInput
                                label=""
                                name="phone"
                                placeholder="Mobile Number"
                                type="text"
                                allowNumbersOnly
                                maxLength={10}
                                // size="middle"
                                classes=""
                            />
                        </Col>

                        {/* </Col> */}
                    </Row>

                    {/* Email Input */}
                    <Row gutter={16}>
                        <Col xs={24}>
                            <TextInput
                                label="Email ID"
                                name="email"
                                placeholder="Enter email address"
                                type="email"
                                classes="w-full"
                                isRequired
                            />
                        </Col>
                    </Row>
                </Form>
            )}
        </Formik>
    );
export default PassengerSelectionForm;
