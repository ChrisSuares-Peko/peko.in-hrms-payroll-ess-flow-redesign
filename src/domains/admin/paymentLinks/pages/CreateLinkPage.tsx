import { useState } from 'react';

import { Button, Col, Flex, Form, Row, Typography } from 'antd';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { paymentLinkNotification } from '@src/domains/dashboard/Invoice/utils/data';

import useCreatePaymentLink from '../hooks/useCreatePaymentLink';
import useGetCorporate from '../hooks/useGetCorporate';
import useGetServiceOperators from '../hooks/useGetServiceOperators';
import { paymentLinkSchema } from '../schema';

const CreateLinkPage = () => {
    const [searchCorporate, setSearchCorporate] = useState<string>('');
    const [searchService, setSearchService] = useState<string>('');
    const { corporateList } = useGetCorporate(searchCorporate);
    const { serviceData } = useGetServiceOperators(searchService);
    const { createPaymentLink, loading } = useCreatePaymentLink();

    return (
        <Row className="w-full mt-10 ">
            <Flex className="w-full" wrap="wrap" justify="space-between">
                <Typography.Text className="text-xl text-valueText">
                    Create Payment Link
                </Typography.Text>
            </Flex>
            <Col className="mt-4" xs={24} md={8}>
                <Flex className="w-full my-5" wrap="wrap" justify="space-between">
                    <Typography.Text className="text-xl text-valueText">
                        Biller Details:
                    </Typography.Text>
                </Flex>
                <Formik
                    initialValues={{
                        corporate: '',
                        service: '',
                        amount: '',
                        expires_at: '',
                        notification: '',
                    }}
                    onSubmit={createPaymentLink}
                    validationSchema={paymentLinkSchema}
                >
                    {({ handleSubmit, setFieldValue }) => (
                        <Form onFinish={handleSubmit} layout="vertical">
                            <Flex vertical className="">
                                <SelectInputWithSearch
                                    options={(corporateList || []).map(d => ({
                                        value: d.value,
                                        label: d.label,
                                    }))}
                                    label="Corporate"
                                    name="corporate"
                                    placeholder="Select Corporate"
                                    classes=""
                                    isRequired
                                    handleChange={value => {
                                        setSearchCorporate(value);
                                        setFieldValue('corporate', value);
                                    }}
                                />
                            </Flex>
                            <Flex vertical className="">
                                <SelectInputWithSearch
                                    options={(serviceData || []).map(d => ({
                                        value: d.value,
                                        label: d.label,
                                    }))}
                                    label="Service"
                                    name="service"
                                    placeholder="Select Service"
                                    classes=""
                                    isRequired
                                    handleChange={value => {
                                        setSearchService(value);
                                        setFieldValue('service', value);
                                    }}
                                />
                            </Flex>

                            <Flex vertical className="">
                                <TextInput
                                    name="amount"
                                    type="text"
                                    label="Amount"
                                    placeholder="Enter Amount"
                                    classes=""
                                    isRequired
                                    allowDecimalsOnly
                                    maxLength={15}
                                />
                            </Flex>

                            <Flex vertical className="">
                                <TextInput
                                    name="expires_at"
                                    type="text"
                                    label="Expiry time(In hours)"
                                    placeholder="Enter Expiry time(In hours)"
                                    classes=""
                                    isRequired
                                    maxLength={10}
                                    allowNumbersOnly
                                />
                            </Flex>

                            <Flex vertical className="">
                                <SelectInput
                                    name="notification"
                                    label="Notification To"
                                    placeholder="Select notification option"
                                    isRequired
                                    options={paymentLinkNotification}
                                    showToolTip
                                    tooltipText="Select where your customer should receive the payment link."
                                />
                            </Flex>

                            <Flex gap={10} className="mt-5">
                                <Button type="primary" danger htmlType="submit" loading={loading}>
                                    Submit
                                </Button>
                            </Flex>
                        </Form>
                    )}
                </Formik>
            </Col>
        </Row>
    );
};

export default CreateLinkPage;
