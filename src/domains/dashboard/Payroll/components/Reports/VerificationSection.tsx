import React from 'react';

import { Col, Form, Row, Typography, Button, Flex } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';

const { Text } = Typography;

const VerificationSection: React.FC = () => (
    <Flex vertical className="mt-6">
        <Typography.Title level={5}>Verification</Typography.Title>
        <Typography.Text type="secondary" className="block mb-3">
            (Please complete the details below)
        </Typography.Text>
        <Form layout="vertical">
            <Row gutter={[16, 16]}>
                <Col xs={24}>
                   
                        <Text>
                            I,{' '}
                            <TextInput
                            classes='w-1/4'
                                placeholder="Enter name" name="name" type="text"                                
                            />
                            son/daughter of{' '}
                            <TextInput
                                placeholder="Enter name" name="name" type="text"                                
                            />
                            working in the capacity of{' '}
                           <TextInput
                                placeholder="Enter designation" name="name" type="text"                                
                            />
                            do hereby certify that a sum of Rs.
                           <TextInput
                                placeholder="Enter amount" name="name" type="text"                                
                            />
                            has been deducted...
                        </Text>
                    
                </Col>
                <Col span={16}>
                    <Col xs={24} md={10}>
                        <DatePickerInput name="date" label="Date" placeholder="Enter" classes='w-full' />
                    </Col>
                    <Col xs={24} md={10}>
                        <TextInput
                            name="place"
                            type="text"
                            label="Place"
                            classes='w-full'
                            placeholder="Enter place"
                        />
                    </Col>
                    <Col xs={24} md={10}>
                        <TextInput
                            name="designation"
                            type="text"
                            classes='w-full'
                            formItemClass='w-full'
                            label="Designation"
                            placeholder="Enter designation"
                        />
                    </Col>
                    <Col xs={24} md={10}>
                        <TextInput
                            name="fullname"
                            type="text"
                            classes='w-full'
                            formItemClass='w-full'
                            label="Full Name"
                            placeholder="Enter full name"
                        />
                    </Col>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Signature of person responsible for deduction of tax">
                        <Button type="dashed" block>
                            Click to Upload Signature
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={[16, 16]} justify="start">
                <Col>
                    <Button type="primary">Submit</Button>
                </Col>
                <Col>
                    <Button type="default">Cancel</Button>
                </Col>
            </Row>
        </Form>
    </Flex>
);

export default VerificationSection;
