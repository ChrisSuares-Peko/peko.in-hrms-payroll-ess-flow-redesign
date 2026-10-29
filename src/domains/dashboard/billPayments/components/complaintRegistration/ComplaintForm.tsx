import React from 'react';

import { Button, Col, Flex, Form, Row } from 'antd';
import { Formik } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import useComplaintRegistrationApi from '../../hooks/useComplaintRegisterApi';
import { complaintSchema } from '../../schema';

const ComplaintForm = () => {
    const { complaintRegistration, isLoading } = useComplaintRegistrationApi();
    // const { serviceProviderData, isLoading: loading } = useServiceProviderApi('All');

    // const billerOptions =
    //     serviceProviderData?.map(item => ({
    //         value: item.value, // Assuming `billerId` is the unique identifier
    //         label: item.label, // Assuming `billerName` is the display name
    //     })) || [];

    return (
        <Formik
            initialValues={{
                // complaintType: '',
                // participationType: '',
                txnRefId: '',
                // billerId: '',
                complaintDisposition: '',
                complaintDesc: '',
            }}
            validationSchema={complaintSchema}
            onSubmit={values => {
                complaintRegistration(values);
            }}
        >
            {({ handleSubmit, resetForm }) => (
                <Form onFinish={handleSubmit} layout="vertical">
                    <Row className="mt-6" gutter={[20, 5]}>
                        {/* Type of Complaint */}
                        {/* <Col xs={24} md={12} order={1}>
                            <TextInput
                                isRequired
                                name="complaintType"
                                type="text"
                                label="Type of Complaint"
                                placeholder="Enter Type of Complaint"
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />
                        </Col> */}

                        {/* Designation */}
                        {/* <Col xs={24} md={12} order={2}>
                            <TextInput
                                isRequired
                                name="participationType"
                                type="text"
                                label="Type of Participation"
                                placeholder="Enter Type of Participation"
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />
                        </Col> */}

                        {/* Mobile Number */}

                        {/* <Col xs={24} md={12} order={4}>
                            <SelectInput
                                isRequired
                                name="billerId"
                                options={billerOptions}
                                label="Biller Id"
                                placeholder={loading ? 'Loading billers...' : 'Select Biller'}
                                // disabled={loading} // Disable while loading data
                            />
                        </Col> */}

                        <Col xs={24} xl={24} md={18} order={1}>
                            <SelectInput
                                isRequired
                                name="complaintDisposition"
                                options={[
                                    {
                                        value: 'Transaction Successful, Amount Debited but services not received',
                                        label: 'Transaction Successful, Amount Debited but services not received',
                                    },
                                    {
                                        value: 'Transaction Successful, Amount Debited but Service Disconnected or Service Stopped',
                                        label: 'Transaction Successful, Amount Debited but Service Disconnected or Service Stopped',
                                    },
                                    {
                                        value: 'Transaction Successful, Amount Debited but Late Payment Surcharge Charges add in next bill',
                                        label: 'Transaction Successful, Amount Debited but Late Payment Surcharge Charges add in next bill',
                                    },
                                    {
                                        value: 'Erroneously paid in wrong account',
                                        label: 'Erroneously paid in wrong account',
                                    },
                                    {
                                        value: 'Duplicate Payment',
                                        label: 'Duplicate Payment',
                                    },
                                    {
                                        value: 'Erroneously paid the wrong amount',
                                        label: 'Erroneously paid the wrong amount',
                                    },
                                    {
                                        value: 'Payment information not received from Biller or Delay in receiving payment information from the Biller',
                                        label: 'Payment information not received from Biller or Delay in receiving payment information from the Biller',
                                    },
                                    {
                                        value: 'Bill Paid but Amount not adjusted or still showing due amount',
                                        label: 'Bill Paid but Amount not adjusted or still showing due amount',
                                    },
                                ]}
                                label="Reason for raising the concern"
                                placeholder="Select Reason"
                            />
                        </Col>
                        <Col xs={24} md={12} order={2}>
                            <TextInput
                                isRequired
                                name="txnRefId"
                                type="text"
                                label="B-Connect Transaction ID"
                                placeholder="Enter B-Connect Transaction ID"
                                maxLength={50}
                            />
                        </Col>

                        <Col xs={24} md={24} order={3}>
                            <InputTextArea
                                autoSize={{ minRows: 3 }}
                                name="complaintDesc"
                                label="Complaint Description"
                                placeholder="Enter Complaint Description"
                                isRequired
                                maxLength={200}
                            />
                        </Col>
                    </Row>

                    {/* navigation section */}
                    <Flex gap={10} className="mt-6">
                        <Button htmlType="button" className="w-36" onClick={() => resetForm()}>
                            Clear
                        </Button>
                        <Button
                            type="primary"
                            loading={isLoading}
                            danger
                            htmlType="submit"
                            className="w-36"
                        >
                            Submit
                        </Button>
                    </Flex>
                </Form>
            )}
        </Formik>
    );
};

export default ComplaintForm;
