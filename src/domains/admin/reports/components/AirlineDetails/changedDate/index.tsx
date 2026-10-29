import React from 'react';

import { Col, Form, Row, Typography } from 'antd';
import { FieldArray, Formik } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import FormikErrorMessage from '@src/domains/dashboard/Airline/components/FormikErrorMessage';

const DateTimeForm = ({ journey }: { journey: any[] }) =>  (
        <Formik
            initialValues={{
                trips: journey,
            }}
            onSubmit={() => {}}
        >
            {({ handleSubmit, values }) => (
                <Form onFinish={handleSubmit} layout="vertical" style={{ padding: '20px' }}>
                    <FieldArray name="trips">
                        {() =>
                            values.trips.map((_: any, index: any) => (
                                <>
                                    <Typography.Text
                                        style={{ fontSize: '16px', fontWeight: 'bold' }}
                                    >
                                        Trip {index + 1}
                                    </Typography.Text>
                                    <Row
                                        gutter={20}
                                        className="w-full lg:w-9/12 xl:w-8/12"
                                        key={index}
                                    >
                                        <Col span={24} md={12}>
                                            <SelectInputWithSearch
                                                label="Departure"
                                                isRequired
                                                name={`trips[${index}].departureAirportCode`}
                                                placeholder="Enter departure location"
                                                options={[]}
                                                isDisabled
                                            />
                                            <FormikErrorMessage
                                                name={`trips[${index}].departureAirportCode`}
                                            />
                                        </Col>
                                        <Col span={24} md={12}>
                                            <SelectInputWithSearch
                                                label="Arrival"
                                                isRequired
                                                name={`trips[${index}].arrivalAirportCode`}
                                                placeholder="Enter arrival"
                                                options={[]}
                                                isDisabled
                                            />
                                            <FormikErrorMessage
                                                name={`trips[${index}].arrivalAirportCode`}
                                            />
                                        </Col>
                                        <Col span={24} md={12}>
                                            {/* <DatePickerInput
                                                label="Departure Date"
                                                isRequired
                                                name={`trips[${index}].departureDate`}
                                                placeholder="Select Date"
                                                classes="rounded-sm w-full"
                                                needConfirm={false}
                                                isDisabled
                                            /> */}
                                            <TextInput
                                                label="Departure Date"
                                                name={`trips[${index}].departureDate`}
                                                placeholder="Select Date"
                                                type="text"
                                                isDisabled
                                                isRequired
                                            />

                                            <FormikErrorMessage
                                                name={`trips[${index}].departureDate`}
                                            />
                                        </Col>
                                        <Col span={24} md={12}>
                                            <SelectInputWithSearch
                                                label="Cabin Class Preference"
                                                isRequired
                                                name={`trips[${index}].cabinPreferences`}
                                                placeholder="Select Cabin Class"
                                                options={[]}
                                                isDisabled
                                            />
                                            <FormikErrorMessage
                                                name={`trips[${index}].cabinPreferences`}
                                            />
                                        </Col>
                                    </Row>
                                </>
                            ))
                        }
                    </FieldArray>
                </Form>
            )}
        </Formik>
    );


export default DateTimeForm;
