import React from 'react';

import { Button, Col, Form, Row, Typography, theme } from 'antd';
import { Formik } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';

import TextAreaInput from './TextAreaInput';

const SoundboxOrderData = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <Row gutter={[20, 20]}>
            <Col span={24}>
                <Col>
                    <Typography.Paragraph className="text-base font-medium leading-6">
                        Basic Details
                    </Typography.Paragraph>
                </Col>
            </Col>
            <Col span={24}>
                <Formik
                    initialValues={{
                        businessName: '',
                        mobileNumber: '',
                        addressLineOne: '',
                        addressLineTwo: '',
                        pincode: '',
                        mid: '',
                        deviceCount: '',
                        aadharCardNumber: '',
                        panCardNumber: '',
                    }}
                    onSubmit={values => {
                        console.log(values);
                    }}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} layout="vertical">
                            <Col span={24}>
                                <Row gutter={60}>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="Business Name"
                                            name="business-name"
                                            placeholder="Enter Business name"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="Mobile Number"
                                            name="mobile-number"
                                            placeholder="Enter Mobile Number"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={60}>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextAreaInput
                                            label="Address Line 1"
                                            name="address-line"
                                            placeholder="Enter Address Line 1"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextAreaInput
                                            label="Address Line 2(Optional)"
                                            name="address-line"
                                            placeholder="Enter Address Line 2"
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={60}>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="Pincode "
                                            name="pincode "
                                            placeholder="Enter Pincode"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="Mid(Optional) "
                                            name="Mid "
                                            placeholder="Enter Mid"
                                            type="text"
                                        />
                                    </Col>
                                </Row>
                            </Col>

                            <Col xs={12} sm={12} md={4} className="mt-7">
                                <TextInput
                                    label="Device Count "
                                    name="device Count "
                                    placeholder="Enter Device Count"
                                    type="number"
                                    isRequired
                                />
                            </Col>
                            <Col>
                                <Typography.Paragraph className="text-base font-medium leading-6 ">
                                    Additional Details
                                </Typography.Paragraph>
                            </Col>
                            <Col>
                                <Row gutter={60} className="mt-10">
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="Aadhar Card Number"
                                            name="aadhar card number"
                                            placeholder="Enter Aadhar Card Number"
                                            type="text"
                                        />
                                    </Col>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="PAN Card Number"
                                            name="pan-card-number"
                                            placeholder="Enter PAN Card Number"
                                            type="text"
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={60}>
                                    <Col xs={24} sm={24} md={7}>
                                        <FileUploadInput
                                            label="Business Proof Type"
                                            name="supportingDoc"
                                        />
                                    </Col>
                                    <Col xs={24} sm={24} md={7}>
                                        <TextInput
                                            label="Business Proof Number"
                                            name="business-proof-number"
                                            placeholder="Enter Business Proof Number"
                                            type="text"
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Form>
                    )}
                </Formik>

                <Col span={24}>
                    <Button
                        style={{ backgroundColor: colorPrimary, color: 'white' }}
                        className="px-10"
                        onClick={() => {}}
                    >
                        Order Now
                    </Button>
                </Col>
            </Col>
        </Row>
    );
};
export default SoundboxOrderData;
