import { MutableRefObject } from 'react';

import { InfoCircleFilled } from '@ant-design/icons';
import { Col, Flex, Form, Row, Select, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import usePhoneCodesApi from '../../hooks/usePhoneCodesApi';
import { contactDetailsSchema } from '../../schema';

type Props = {
    formRef?: MutableRefObject<any>;
};

export default function ContactDetails({ formRef }: Props) {
    const { phoneCodes } = usePhoneCodesApi();
    const savedPhone = useAppSelector(state => state.reducer.busTicket.contactPhone);
    const savedEmail = useAppSelector(state => state.reducer.busTicket.contactEmail);

    return (
        <Flex
            vertical
            gap={20}
            style={{
                background: 'white',
                border: '1px solid #D9D9D9',
                borderRadius: 16,
                padding: 30,
            }}
        >
            <Flex
                gap={8}
                align="center"
                style={{ background: '#F3F7FF', borderRadius: 12, padding: '10px 16px' }}
            >
                <InfoCircleFilled style={{ color: '#1890FF', fontSize: 16, flexShrink: 0 }} />
                <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)' }}>
                    Your ticket details will be sent to below details
                </Typography.Text>
            </Flex>

            <Formik
                initialValues={{ countryCode: '+91', phone: savedPhone || '', email: savedEmail || '' }}
                innerRef={formRef}
                validationSchema={contactDetailsSchema}
                onSubmit={() => {}}
            >
                {({ handleSubmit, values, setFieldValue }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Row className="mt-2">
                            <Col span={24}>
                                <Flex className="mb-2">
                                    <Typography.Text>
                                        <Typography.Text className="text-red-500 me-1">*</Typography.Text>
                                        Phone Number
                                    </Typography.Text>
                                </Flex>
                                <Row gutter={8}>
                                    <Col xs={8}>
                                        <Select
                                            showSearch
                                            value={values.countryCode}
                                            onChange={val => setFieldValue('countryCode', val)}
                                            className="w-full"
                                            options={phoneCodes}
                                            filterOption={(input, option) =>
                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        />
                                    </Col>
                                    <Col xs={16}>
                                        <TextInput
                                            name="phone"
                                            type="text"
                                            placeholder="Enter phone number"
                                            allowNumbersOnly
                                            maxLength={10}
                                            isRequired
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Row className="mt-2">
                            <Col span={24}>
                                <TextInput
                                    name="email"
                                    label="Email ID"
                                    placeholder="Enter email ID"
                                    type="text"
                                    allowEmailsOnly
                                    isRequired
                                />
                            </Col>
                        </Row>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
}
