import React, { useState } from 'react';

import { Button, Checkbox, Col, Flex, Form, Radio, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import EnterAgeModal from '../../components/EnterAgeModal';
import PersonNameCard from '../../components/PersonNameCard';
import SectionHeader from '../../components/SectionHeader';
import { personsList } from '../../utils/data';

const HealthInsurance = () => {
    const [openEnterAgeModal, setOpenEnterAgeModal] = useState(false);
    return (
        <Content className="sm:px-8">
            <Flex vertical gap={20}>
                <SectionHeader title="Health Insurance" subTitle="Health Insurance made simple" />
                <Formik
                    initialValues={{
                        fullName: '',
                        mobileNumber: '',
                        city: '',
                    }}
                    onSubmit={values => {
                        console.log(values);
                    }}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} layout="vertical" className="">
                            <Flex vertical>
                                <Radio.Group
                                    buttonStyle="outline"
                                    size="large"
                                    defaultValue="male"
                                    className="mb-8"
                                >
                                    <Radio value="male">Male</Radio>
                                    <Radio value="female">Female</Radio>
                                </Radio.Group>

                                <Row gutter={30}>
                                    <Col xs={24} sm={12} xl={7}>
                                        <TextInput
                                            label="Full Name"
                                            name="fullName"
                                            placeholder="Enter Full Name"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12} xl={7}>
                                        <TextInput
                                            label="Mobile Number"
                                            name="mobileNumber"
                                            placeholder="Enter Mobile Number"
                                            type="number"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={0} sm={0} xl={10} />
                                    <Col xs={24} sm={12} xl={7}>
                                        <TextInput
                                            label="City"
                                            name="city"
                                            placeholder="Enter City"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                            </Flex>

                            <Typography.Title level={4} style={{ fontWeight: 500 }}>
                                Who Would You Like To Insure
                            </Typography.Title>
                            <Col xl={24} className="my-5">
                                <Checkbox.Group style={{ width: '100%' }} defaultValue={['Self']}>
                                    <Row className="gap-6">
                                        {personsList.map(item => (
                                            <PersonNameCard
                                                key={item.id}
                                                personName={item.personName}
                                                isIncrease={item.isIncrease}
                                            />
                                        ))}
                                    </Row>
                                </Checkbox.Group>
                            </Col>

                            <Col className="mt-5" lg={5}>
                                <Button
                                    danger
                                    type="primary"
                                    size="middle"
                                    className="w-full rounded-sm"
                                    onClick={() => setOpenEnterAgeModal(true)}
                                >
                                    Continue
                                </Button>
                            </Col>
                        </Form>
                    )}
                </Formik>
                <EnterAgeModal
                    open={openEnterAgeModal}
                    handleCancel={() => setOpenEnterAgeModal(false)}
                />
            </Flex>
        </Content>
    );
};
export default HealthInsurance;
