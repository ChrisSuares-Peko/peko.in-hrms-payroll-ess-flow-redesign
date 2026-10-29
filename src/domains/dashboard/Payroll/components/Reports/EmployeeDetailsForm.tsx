import React from 'react';

import { Col, DatePicker, Row, Typography, Form, Flex } from 'antd';
import dayjs from 'dayjs';
import { Field } from 'formik';

import TextInput from '../Employees/TextInput';

const EmployeeDetailsForm: React.FC = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    return (
        <Flex vertical className="w-full rounded-lg border border-[#EAEAEA] p-3 md:p-6">
            <Typography.Title level={5}>Employee Details</Typography.Title>
            <Row gutter={[16, 16]} className="mt-4 w-full">
                {/* <Col xs={24} md={10}>
                    <SelectInput
                        name="employee"
                        options={[]}
                        classes="w-full"
                        formItemClass="w-full"
                        label="Select Employee"
                        placeholder="Select the Employee"
                    />
                </Col> */}
                <Col xs={24} md={12}>
                    <TextInput
                        name="employee"
                        classes="w-full"
                        formItemClass="w-full"
                        label="Employee Name"
                        placeholder="Enter Employee Name"
                        type="text"
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="address"
                        label="Employee Address"
                        placeholder="Enter Address"
                        type="text"
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="pan"
                        label="Employee PAN"
                        placeholder="Enter PAN"
                        classes="w-full"
                        type="text"
                        isRequired
                        allowUpperCaseOnly
                        maxLength={10}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="tan"
                        label="Employee TAN"
                        placeholder="Enter TAN"
                        classes="w-full"
                        type="text"
                        isRequired
                        allowUpperCaseOnly
                        maxLength={10}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="employeeRefNo"
                        label="Employee Ref. No.(Optional)"
                        placeholder="Enter Employee Ref. No."
                        classes="w-full"
                        type="text"
                        // isRequired
                    />
                </Col>
                {/* <Col xs={24} md={10}>
                    <Form.Item label="Period with the Employer" name="period">
                       <DatePicker.RangePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder={['Start Date', 'End Date']}
                        />
                    </Form.Item>
                </Col> */}
            </Row>
            <Typography.Title level={5}>Employer Details</Typography.Title>
            <Row gutter={[16, 16]} className="mt-4 w-full">
                {/* <Col xs={24} md={10}>
                    <SelectInput
                        name="employee"
                        options={[]}
                        classes="w-full"
                        formItemClass="w-full"
                        label="Select Employee"
                        placeholder="Select the Employee"
                    />
                </Col> */}
                <Col xs={24} md={12}>
                    <TextInput
                        name="employerName"
                        classes="w-full"
                        formItemClass="w-full"
                        label="Employer Name"
                        placeholder="Enter Employer Name"
                        type="text"
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="employerAddress"
                        label="Employer Address"
                        placeholder="Enter Address"
                        type="text"
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="employerPan"
                        label="PAN of Employer"
                        placeholder="Enter PAN"
                        classes="w-full"
                        type="text"
                        isRequired
                        allowUpperCaseOnly
                        maxLength={10}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Period with the Employer" name="period">
                        <Field name="period">
                            {({ field, form }: any) => (
                                <DatePicker.RangePicker
                                    className="w-full"
                                    format="DD/MM/YYYY"
                                    value={field.value}
                                    onChange={dates => form.setFieldValue('period', dates)}
                                    onBlur={() => form.setFieldTouched('period', true)}
                                />
                            )}
                        </Field>
                    </Form.Item>
                </Col>
                {/* <Col xs={24} md={10}>
                    <TextInput
                        name="employeeRefNo"
                        label="Employee Ref. No."
                        placeholder="Enter Employee Ref. No."
                        classes="w-full"
                        type="text"
                        isRequired
                    />
                </Col> */}
                <Col xs={24} md={12}>
                    <TextInput
                        name="certificateNumber"
                        label="Certificate Number"
                        placeholder="Enter Certificate number"
                        classes="w-full"
                        type="text"
                        isRequired
                    />
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Updated Date" name="updatedDate">
                        <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            defaultValue={dayjs(today, todayFormatted)}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="citAddress"
                        label="CIT Address"
                        placeholder="Enter CIT Address"
                        classes="w-full"
                        type="text"
                        isRequired
                    />
                </Col>
            </Row>
        </Flex>
    );
};
export default EmployeeDetailsForm;
