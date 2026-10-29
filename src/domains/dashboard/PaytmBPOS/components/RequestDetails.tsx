import { useRef } from 'react';

import { Button, Col, Form, Row, Typography, theme } from 'antd';
import { Formik, FormikProps } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import useBasicInfoApi from '../hooks/useBasicInfoApi';
import useRequestDemoApi from '../hooks/useRequestDemoApi';
import { requestDetailsSchema } from '../schema/index';
import { RequestFormValues } from '../types/index';

const RequestDetails = () => {
    const { data } = useBasicInfoApi();
    const { handleRequestCreation, isLoading } = useRequestDemoApi();
    const requestFormRef = useRef<FormikProps<RequestFormValues>>(null);
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <Row gutter={[20, 20]}>
            <Col span={24}>
                <Col>
                    <Typography.Paragraph className="text-base font-medium leading-6">
                        Enter Details
                    </Typography.Paragraph>
                </Col>
            </Col>
            <Col span={24}>
                <Formik
                    enableReinitialize
                    initialValues={{
                        storeName: data?.companyName ?? '',
                        businessCategory: '',
                        contactPerson: data?.contactPersonName ?? '',
                        mobileNumber: data?.mobileNo ?? '',
                        email: data?.email ?? '',
                        city: data?.city ?? '',
                        preferredLanguage: '',
                    }}
                    innerRef={requestFormRef}
                    validationSchema={requestDetailsSchema}
                    onSubmit={async values => {
                        await handleRequestCreation(values);
                    }}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} layout="vertical">
                            <Col span={24}>
                                <Row gutter={60}>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="Store Name"
                                            name="storeName"
                                            placeholder="Enter Store Name"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="Business Category (Optional)"
                                            name="businessCategory"
                                            placeholder="Enter Business Category"
                                            type="text"
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={60}>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="Contact Person Name"
                                            name="contactPerson"
                                            placeholder="Enter Contact Person Name"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="Mobile Number"
                                            name="mobileNumber"
                                            placeholder="Enter Mobile Number"
                                            type="text"
                                            isRequired
                                            allowNumbersOnly
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={60}>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="Email Id "
                                            name="email"
                                            placeholder="Enter Email Id"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="City (Optional)"
                                            name="city"
                                            placeholder="Enter City"
                                            type="text"
                                        />
                                    </Col>
                                </Row>
                                <Row gutter={60}>
                                    <Col xs={24} sm={12} xl={8} xxl={7}>
                                        <TextInput
                                            label="Preferred language (Optional)"
                                            name="preferredLanguage"
                                            placeholder="Enter Preferred language"
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
                        onClick={() => {
                            requestFormRef.current?.handleSubmit();
                        }}
                        loading={isLoading}
                    >
                        Submit
                    </Button>
                </Col>
            </Col>
        </Row>
    );
};

export default RequestDetails;
