import React from 'react';

import { Row, Col, Card, Flex, Form, Typography, Select } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { ReceiverDetailsSchema } from '../schema/ReceiverDetailsSchema';
import { addCustomerInfo, setContactInfoValid } from '../slices/airlineSlice';
// import {
//     addCustomerInfo,
//     setAncillariesConversationId,
//     setAncillariesOfferId,
// } from '../slices/airlineSlice';
// import { ProvBookingSuccess } from '../types/provBooking';

type Props = {
    formRef: React.MutableRefObject<any>;
    contanctFormRef: React.MutableRefObject<any>;
    phoneCodes: any[];
    sharedContactInfo: any;
};

const ReceiverDetails = ({ formRef, contanctFormRef, phoneCodes, sharedContactInfo }: Props) => {
    const { isContactInfoValid, contactInfoPassenger, bookingData } = useAppSelector(
        state => state.reducer.airline
    );
    const { customerInfo } = bookingData;
    const dispatch = useAppDispatch();

    // const [isContactInfoValid, setIsContactInfoValid] = useState(false);
    return (
        <Row className="mt-10">
            <Col span={24}>
                <Card
                    size="small"
                    className="py-4 px-7 border rounded-[28px] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
                >
                    <Typography.Paragraph className="mb-6 text-xl font-medium leading-7">
                        Booking details will be sent to
                    </Typography.Paragraph>
                    <Row>
                        <Formik
                            initialValues={{
                                phone: sharedContactInfo.phone || customerInfo.phone || '',
                                phoneCode:
                                    sharedContactInfo.phoneCode || customerInfo.phoneCode || '+91',
                                email: sharedContactInfo.email || customerInfo.emailAddress || '',
                            }}
                            enableReinitialize
                            innerRef={formRef}
                            validationSchema={ReceiverDetailsSchema}
                            validateOnMount
                            onSubmit={async values => {
                                dispatch(addCustomerInfo(values));
                            }}
                        >
                            {({ handleSubmit, handleChange, errors, values, isValid }) => {
                                if (isValid !== isContactInfoValid) {
                                    dispatch(
                                        setContactInfoValid({
                                            isContactInfoValid: isValid,
                                        })
                                    );
                                }
                                return (
                                    <Form
                                        onFinish={handleSubmit}
                                        layout="vertical"
                                        autoComplete="off"
                                        className="w-full mt-5 "
                                        disabled={!!contactInfoPassenger}
                                    >
                                        <Row justify="start" gutter={[24, 0]} ref={contanctFormRef}>
                                            <Col md={12} xxl={10}>
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    Mobile Number
                                                </Typography.Text>
                                                <Flex className="mt-2" gap={8}>
                                                    <div className="shrink-0">
                                                        <Select
                                                            showSearch
                                                            options={phoneCodes ?? []}
                                                            placeholder="Country Code"
                                                            // defaultValue="+971"
                                                            value={values.phoneCode}
                                                            onChange={e =>
                                                                handleChange('phoneCode')(e)
                                                            }
                                                            className="w-[107px]"
                                                            filterOption={(input: string, option) =>
                                                                (
                                                                    (option &&
                                                                        option?.label.toLowerCase()) ??
                                                                    ''
                                                                ).includes(input.toLowerCase())
                                                            }
                                                        />
                                                        <Typography.Text className="text-red-500">
                                                            {typeof errors.phoneCode === 'string'
                                                                ? errors.phoneCode
                                                                : ''}
                                                        </Typography.Text>
                                                    </div>
                                                    <div className="flex-1">
                                                        <TextInput
                                                            type="text"
                                                            placeholder="Enter Mobile Number"
                                                            name="phone"
                                                            allowNumbersOnly
                                                            maxLength={15}
                                                            isRequired
                                                        />
                                                    </div>
                                                </Flex>
                                            </Col>
                                            <Col md={12} xxl={10}>
                                                <TextInput
                                                    label="Email ID"
                                                    name="email"
                                                    isRequired
                                                    placeholder="Enter Email ID"
                                                    type="text"
                                                    maxLength={50}
                                                    allowLowerCaseOnly
                                                />
                                            </Col>
                                        </Row>
                                    </Form>
                                );
                            }}
                        </Formik>
                    </Row>
                </Card>
            </Col>
        </Row>
    );
};

export default ReceiverDetails;
