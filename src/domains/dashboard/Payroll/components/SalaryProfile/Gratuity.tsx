import React from 'react';

import { Flex, Row, Col, Button, Form, Typography, Divider } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import GetGratuityAmount from '../../hooks/employeeSalaryHooks/gratuityHooks/useGetEmployeeGratuityApi';
import { payrollGratuitySchema } from '../../schema/EmployeeSalary';

const Gratuity = () => {
    const { basicSalary, dateOfJoin } = useAppSelector(state => state.reducer.payrollSalary);
    const { calculateGrauityAmount, GratuityAmount, isLoading } = GetGratuityAmount();

    const initialValues = {
        basicSalary,
        fromDate: dayjs(dateOfJoin) || '',
        toDate: '',
    };
    return (
        <Flex vertical className=" my-8">
            <Formik
                initialValues={initialValues}
                validationSchema={payrollGratuitySchema}
                onSubmit={values => {
                    calculateGrauityAmount({
                        ...values,
                    });
                }}
            >
                {({ handleSubmit, values }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Row gutter={50} className="w-fit md:w-3/4">
                            <Col xs={24} sm={12}>
                                <TextInput
                                    label="Basic Salary"
                                    name="basicSalary"
                                    type="text"
                                    placeholder="Enter Your Basic Salary"
                                    allowNumbersOnly
                                    maxLength={6}
                                />
                            </Col>

                            <Col xs={24} sm={12}>
                                <DatePickerInput
                                    name="fromDate"
                                    placeholder="Select Date"
                                    classes="w-full"
                                    label="First Working Day"
                                    needConfirm={false}
                                    minDate={dayjs(dateOfJoin)}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DatePickerInput
                                    name="toDate"
                                    placeholder="Select Date"
                                    classes="w-full"
                                    label="Last Working Day"
                                    needConfirm={false}
                                    showToolTip
                                    tooltipText="Employee must serve minimum one year for gratuity calculation."
                                    minDate={dayjs(
                                        dayjs(values.fromDate).add(1, 'year').format('YYYY-MM-DD')
                                    )}
                                />
                            </Col>
                        </Row>

                        <Flex className="mt-6">
                            <Button
                                htmlType="submit"
                                type="primary"
                                danger
                                className=" font-semibold w-[10rem]"
                                loading={isLoading}
                            >
                                Calculate
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
            <Row gutter={50} className="w-fit md:w-3/4 mt-12">
                <Col xs={24}>
                    <Divider className="bg-gray-300 " style={{ height: '.1rem' }} />
                    <Flex justify="space-between" className="h-20">
                        <Flex>
                            <Typography.Text className="font-semibold">
                                Total Gratuity
                            </Typography.Text>
                            <Typography.Text
                                className="ml-2 text-gray-500 "
                                style={{ fontSize: '.75rem', marginTop: '.2rem' }}
                            >
                                (Approximate)
                            </Typography.Text>
                        </Flex>
                        <Flex vertical gap={20}>
                            <Typography.Text className="font-semibold">Amount</Typography.Text>
                            {GratuityAmount ? (
                                <Typography.Text
                                    style={{ fontSize: '1.5rem' }}
                                    className="font-bold text-textLime"
                                >
                                    AED{' '}
                                    {new Intl.NumberFormat('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }).format(Number(GratuityAmount))}
                                </Typography.Text>
                            ) : (
                                ''
                            )}
                        </Flex>
                    </Flex>
                    <Divider className="bg-gray-300 " style={{ height: '.1rem' }} />
                    <Flex vertical className="mt-4" gap={20}>
                        <Typography.Text
                            className="text-gray-500 font-normal"
                            style={{ fontSize: '.75rem' }}
                        >
                            How gratuity in UAE is calculated
                        </Typography.Text>
                        <Typography.Text
                            className="text-gray-500 font-normal"
                            style={{ fontSize: '.75rem' }}
                        >
                            The UAE law entitles every worker to receive end-of-service benefits,
                            also known as Gratuity, if they work for a minimum period of one
                            year.When calculating the period of service, days of absence without pay
                            are not included and employers may deduct any amounts owed by the worker
                            from their gratuity payment. UAE Gratuity is calculated based on 21
                            days’ wage for each year of the first five years of their service, and
                            30 days’ wage for each additional year.
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default Gratuity;
