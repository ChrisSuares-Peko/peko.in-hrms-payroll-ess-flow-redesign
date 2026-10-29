import React from 'react';

import { Form, Row, Col, Select, Flex, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import PriceFooter from './adaptive/PriceFooter';
import { ReceiverDetailsSchema } from '../schema/ReceiverDetailsSchema';
import { addCustomerInfo } from '../slices/airlineSlice';
import { AllFareQuote } from '../types/fareRules';

type Props = {
    fareQuotes: AllFareQuote;
    isLoading?: boolean;
    phoneCodes: any[];
    handleBooking: () => void;
    sharedContactInfo: any;
};
const { Paragraph } = Typography;

const ContactInfoForm = ({
    isLoading,
    phoneCodes,
    fareQuotes,
    handleBooking,
    sharedContactInfo,
}: Props) => {
    const dispatch = useAppDispatch();
    const { bookingData } = useAppSelector(
        state => state.reducer.airline
    );
    return (
        <Formik
            initialValues={{
                phoneCode:
                    sharedContactInfo.phoneCode || bookingData.customerInfo.phoneCode || '+91',
                phone: sharedContactInfo.phone || bookingData.customerInfo.phone || '',
                email: sharedContactInfo.email || bookingData.customerInfo.emailAddress || '',
            }}
            enableReinitialize
            validationSchema={ReceiverDetailsSchema}
            onSubmit={values => {
                dispatch(addCustomerInfo(values));
                handleBooking();
            }}
        >
            {({ handleSubmit, handleChange }) => (
                <Form onFinish={handleSubmit} layout="horizontal">
                    <Paragraph className="text-lg font-bold">Contact Information</Paragraph>
                    <Paragraph className="text-sm text-gray-500">
                        Your booking details will be sent here
                    </Paragraph>
                    <Flex className="my-4">
                        <Typography.Text className="">
                            <span style={{ color: 'lightRed' }} className="text-lightRed ">
                                *
                            </span>{' '}
                            Mobile Number
                        </Typography.Text>
                    </Flex>
                    <Row gutter={8}>
                        <Col xs={10} className="w-full">
                            <Select
                                showSearch
                                options={phoneCodes ?? []}
                                placeholder="Country Code"
                                defaultValue="+91"
                                onSelect={e => handleChange('phoneCode')(e)}
                                className="border-r-0 w-full"
                                disabled={isLoading}
                                filterOption={(input: string, option) =>
                                    (option?.label ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            />
                        </Col>
                        <Col xs={14}>
                            <TextInput
                                label=""
                                name="phone"
                                placeholder="Enter Mobile Number"
                                type="text"
                                allowNumbersOnly
                                maxLength={10}
                                classes=""
                                isDisabled={isLoading}
                            />
                        </Col>
                        <Col xs={24} className="-mt-3">
                            <TextInput
                                label="Email ID"
                                name="email"
                                placeholder="Enter Email ID"
                                type="email"
                                classes="w-full"
                                isRequired
                                maxLength={50}
                                isDisabled={isLoading}
                            />
                        </Col>
                    </Row>

                    <PriceFooter
                        isLoading={isLoading}
                        price={fareQuotes.combined.Fare.PublishedFare ?? 0}
                        handleClick={() => {
                            handleSubmit();
                        }}
                    />
                </Form>
            )}
        </Formik>
    );
};
export default ContactInfoForm;
