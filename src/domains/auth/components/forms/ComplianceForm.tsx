import React from 'react';

import {
    Form,
    Button,
    Select,
    DatePicker,
    Row,
    Col,
    Flex,
    Typography,
    Card,
} from 'antd';
import { Formik } from 'formik';

import IndianFlag from '@assets/svg/indianFlag.svg';
import TextInput from '@components/atomic/inputs/TextInput';

const { Option } = Select;
const { Title, Text } = Typography;

const CompanyIdentificationForm = () => {
    const handleSubmitForm = (values: any) => {
        console.log('Form Values:', values);
    };

    return (
        <Formik
            initialValues={{
                cin: '',
                companyName: '',
                incorporationDate: '',
                companyType: '',
                registeredState: '',
                complianceEmail: '',
                mobileNumber: '',
                panNumber: '',
                tanNumber: '',
                gstNumber: '',
            }}
            onSubmit={handleSubmitForm}
        >
            {({ handleSubmit, setFieldValue }) => (
                <Form onFinish={handleSubmit} layout="vertical">
                      <Card
            style={{
                width: '100%',
                maxWidth: 920,
                borderRadius: 20,
            }}
            bodyStyle={{ padding: 32 }}
        >

                    {/* Section Header */}
                    <Flex vertical gap={4} style={{ marginBottom: 20 }}>
                        <Title level={5} style={{ margin: 0 }}>
                            Company Identification
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Enter your company details to fetch information from MCA
                        </Text>
                    </Flex>

                    {/* Inner Container */}
                 
                        <Row gutter={[15, 5]}>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="cin"
                                    label="Corporate Identity Number (CIN) *"
                                    placeholder="E.g. 38JDB7848HC"
                                    size="large"
                                    type="text"
                                />
                            </Col>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="companyName"
                                    label="Company Name *"
                                    placeholder="Enter Company name"
                                    size="large"
                                     type="text"
                                />
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Date of Incorporation *">
                                    <DatePicker
                                        className="w-full"
                                        size="large"
                                        format="DD/MM/YYYY"
                                        onChange={(date) =>
                                            setFieldValue(
                                                'incorporationDate',
                                                date ? date.format('YYYY-MM-DD') : ''
                                            )
                                        }
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Company Type *">
                                    <Select
                                        size="large"
                                        placeholder="Select type"
                                        onChange={(value) =>
                                            setFieldValue('companyType', value)
                                        }
                                    >
                                        <Option value="private_limited">
                                            Private Limited
                                        </Option>
                                        <Option value="public_limited">
                                            Public Limited
                                        </Option>
                                        <Option value="llp">LLP</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item label="Registered State *">
                                    <Select
                                        size="large"
                                        placeholder="Select state"
                                        onChange={(value) =>
                                            setFieldValue('registeredState', value)
                                        }
                                    >
                                        <Option value="KA">Karnataka</Option>
                                        <Option value="MH">Maharashtra</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="complianceEmail"
                                    label="Email for Compliance Alerts *"
                                    placeholder="test@gmail.com"
                                    size="large"
                                     type="text"
                                />
                            </Col>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="mobileNumber"
                                    label="Mobile Number *"
                                    placeholder="Mobile Number"
                                    size="large"
                                    maxLength={10}
                                     type="text"
                                    allowNumbersOnly
                                    prefix={
                                        <Flex align="center" gap={6}>
                                            <img src={IndianFlag} alt="India" />
                                            <Text>+91</Text>
                                        </Flex>
                                    }
                                />
                            </Col>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="panNumber"
                                    label="PAN Number *"
                                    placeholder="SA2FF3XC"
                                    size="large"
                                     type="text"
                                />
                            </Col>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="tanNumber"
                                    label="TAN Number *"
                                    placeholder="Enter TAN number"
                                    size="large"
                                     type="text"
                                />
                            </Col>

                            <Col xs={24} md={12}>
                                <TextInput
                                    name="gstNumber"
                                    label="GST Number *"
                                    placeholder="Enter GST number"
                                    size="large"
                                     type="text"
                                />
                            </Col>

                        </Row>
                        </Card>
                    

                    {/* Buttons */}
                    <Flex gap={16} style={{ marginTop: 24 }}>
                        <Button
                            size="large"
                            style={{
                                flex: 1,
                                borderColor: '#ff4d4f',
                                color: '#ff4d4f',
                            }}
                        >
                            Back
                        </Button>

                        <Button
                            htmlType="submit"
                            type="primary"
                            danger
                            size="large"
                            style={{ flex: 1 }}
                        >
                            Fetch details from MCA
                        </Button>
                    </Flex>

                    {/* Skip */}
                    <Flex justify="center" style={{ marginTop: 12 }}>
                        <Text type="danger" style={{ fontSize: 13 }}>
                            Skip for now
                        </Text>
                    </Flex>

                </Form>
            )}
        </Formik>
    );
};

export default CompanyIdentificationForm;