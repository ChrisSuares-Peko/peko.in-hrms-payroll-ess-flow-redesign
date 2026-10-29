import React, { useState } from 'react';

import { Button, Col, Flex, Form, Row } from 'antd';
import { Formik } from 'formik';

import IndianFlag from '@assets/svg/indianFlag.svg';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';

import CustomSelect from './CustomSelect';
import CustomerModal from '../../components/customers/CustomerModal';
import { useCustomerDropdown } from '../../hooks/useCustomerDropdown';
import useGetPaymentlink from '../../hooks/useGetPaymentlinkApi';
import { paymentLinkSchema } from '../../schema/index';
import { resetDetails, setpaymentLinkPayload } from '../../slices/InvoicesSlices';
import { paymentLinkNotification } from '../../utils/data';

const CreatePaymentLink = () => {
    const dispatch = useAppDispatch();
    const { getPaymentLink, isLoading } = useGetPaymentlink();

    const handleClick = (values: any) => {
        dispatch(setpaymentLinkPayload(values));
        dispatch(resetDetails());
        getPaymentLink({ ...values });
    };

    const { tableData, setRefresh } = useCustomerDropdown('');

    const customerOptions = tableData?.map(customer => ({
        value: customer.value,
        label: customer.label,
        email: customer.email,
        mobileNo: customer.mobileNo,
        // other fields as needed
    }));

    const [showAddCustomer, setShowAddCustomer] = useState<boolean>(false);

    return (
        <Row className="w-full mt-5">
            <Col className="mt-4" xs={24} md={8}>
                <Formik
                    initialValues={{
                        full_name: '',
                        phone_number: '',
                        email: '',
                        amount: '',
                        expires_at: '',
                        purpose_message: '',
                        notification: 'EML',
                    }}
                    onSubmit={handleClick}
                    validationSchema={paymentLinkSchema}
                >
                    {({ handleSubmit, setFieldValue }) => (
                        <Form onFinish={handleSubmit} layout="vertical">
                            <Flex vertical className="">
                                <CustomSelect
                                    showSearch
                                    options={customerOptions}
                                    label="Select saved customer"
                                    handleChange={selectedCustomer => {
                                        // Populate fields based on selected customer
                                        if (selectedCustomer) {
                                            setFieldValue('full_name', selectedCustomer.label);
                                            setFieldValue(
                                                'phone_number',
                                                selectedCustomer.mobileNo
                                            );
                                            setFieldValue('email', selectedCustomer.email);
                                        } else {
                                            setFieldValue('full_name', '');
                                            setFieldValue('phone_number', '');
                                            setFieldValue('email', '');
                                        }
                                    }}
                                    onAddOptionClick={() => {
                                        setShowAddCustomer(true);
                                    }}
                                    showAddOption
                                />
                            </Flex>
                            <Flex vertical className="mt-6">
                                <TextInput
                                    label="Customer Name"
                                    name="full_name"
                                    type="text"
                                    placeholder="Enter Customer Name"
                                    classes=""
                                    isRequired
                                    allowAlphabetsAndSpaceOnly
                                    maxLength={50}
                                />
                            </Flex>
                            <Flex vertical className="">
                                <TextInput
                                    name="phone_number"
                                    type="text"
                                    label="Mobile Number"
                                    placeholder="Enter Mobile Number"
                                    classes=""
                                    isRequired
                                    maxLength={10}
                                    allowNumbersOnly
                                    prefix={
                                        <Flex
                                            align="center"
                                            gap={6}
                                            className="p-2 h-full border-e me-2 cursor-not-allowed"
                                        >
                                            <img src={IndianFlag} alt="" />
                                            <p>+91</p>
                                        </Flex>
                                    }
                                />
                            </Flex>
                            <Flex vertical className="">
                                <TextInput
                                    name="email"
                                    type="text"
                                    label="Email ID"
                                    placeholder="Enter Email ID"
                                    classes=""
                                    allowLowerCaseOnly
                                    isRequired
                                    maxLength={50}
                                />
                            </Flex>
                            <Flex vertical className="">
                                <TextAreaInput
                                    name="purpose_message"
                                    label="Purpose message"
                                    placeholder="Enter Purpose message"
                                    isRequired
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
                                    allowTwoDecimalsOnly
                                    maxLength={11}
                                />
                            </Flex>
                            {/* <Flex vertical className="">
                        <DatePickerInput
                            placeholder="Enter Expiry date"
                            name="expires_at"
                            label="Expiry Date"
                            needConfirm={false}
                            classes="w-full"
                            minDate={tomorrow}
                            showToolTip
                            tooltipText="Default expiry is 3 days if no date is selected."
                        />
                    </Flex> */}
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
                                <Button
                                    type="primary"
                                    className="px-5"
                                    size="large"
                                    danger
                                    htmlType="submit"
                                    loading={isLoading}
                                >
                                    Submit
                                </Button>
                            </Flex>
                        </Form>
                    )}
                </Formik>
            </Col>

            {showAddCustomer && (
                <CustomerModal
                    setRefresh={setRefresh}
                    open={showAddCustomer}
                    handleCancel={() => setShowAddCustomer(false)}
                />
            )}
        </Row>
    );
};

export default CreatePaymentLink;
