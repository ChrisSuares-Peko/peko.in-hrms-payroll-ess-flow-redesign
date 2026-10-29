import { Button, Col, Flex, Form, Image, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import {
    ACCOUNT_TYPE_OPTIONS,
    AMOUNT_RULE_OPTIONS,
    AUTHENTICATION_MODE_OPTIONS,
    ENACH_CATEGORY_OPTIONS,
    ENACH_FREQUENCY_OPTIONS,
    ENACH_INITIAL_VALUES,
    ENachFormValues,
} from './ENachForm.types';
import FlagInd from "../assets/icons/flag_ind.svg"
import { enachValidationSchema } from '../schema/paymentLinkSchema';

interface ENachFormViewProps {
    initialValues?: ENachFormValues;
    onBack: () => void;
    onSubmit: (values: ENachFormValues) => void;
    loading?: boolean;
}

const ENachFormView = ({ initialValues, onBack, onSubmit, loading }: ENachFormViewProps) => (
    <Formik
        initialValues={initialValues || ENACH_INITIAL_VALUES}
        validationSchema={enachValidationSchema}
        onSubmit={onSubmit}
        enableReinitialize
    >
        {({ values, setFieldValue, handleSubmit }) => (
            <Form layout="vertical">
                <Flex vertical gap={24} className="pt-2">
                    <Flex vertical gap={4}>
                        <Typography.Title level={4} className="!mb-0 !font-bold">
                            Create eNACH Mandate
                        </Typography.Title>
                        <Typography.Text className="text-gray-500">
                            Set up a recurring payment mandate for your customer
                        </Typography.Text>
                    </Flex>

                    <div className="rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                        <Flex vertical gap={16}>
                            <Typography.Text className="font-bold text-base">
                                Customer Details
                            </Typography.Text>

                            <TextInput
                                name="customerName"
                                label="Customer Name"
                                placeholder="Customer Name"
                                type="text"
                                size="large"
                                isRequired
                                allowAlphabetsAndSpaceOnly
                            />

                            <Row gutter={12}>
                                <Col xs={24} sm={12}>
                                    <TextInput
                                        name="email"
                                        label="Email Address"
                                        placeholder="Enter Email"
                                        type="email"
                                        size="large"
                                        isRequired
                                        allowEmailsOnly
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <TextInput
                                        name="mobile"
                                        label="Mobile Number"
                                        placeholder="Mobile Number"
                                        type="text"
                                        size="large"
                                        isRequired
                                        allowNumbersOnly
                                        maxLength={10}
                                        inputMode="numeric"
                                        prefix={
                                            <Flex align="center" gap={4}>
                                                <Image src={FlagInd} width={20}/>
                                                <Typography.Text className="text-sm text-gray-500">+91</Typography.Text>
                                            </Flex>
                                        }
                                    />
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col xs={24} sm={12}>
                                    <TextInput
                                        name="accountNumber"
                                        label="Account Number"
                                        placeholder="Enter account number"
                                        type="text"
                                        size="large"
                                        isRequired
                                        allowNumbersOnly
                                        maxLength={18}
                                        inputMode="numeric"
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <SelectInput
                                        name="accountType"
                                        label="Account Type"
                                        placeholder="Select account type"
                                        options={ACCOUNT_TYPE_OPTIONS}
                                        size="large"
                                        isRequired
                                    />
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col xs={24} sm={12}>
                                    <TextInput
                                        name="bankCode"
                                        label="Bank Code"
                                        placeholder="Enter bank code"
                                        type="text"
                                        size="large"
                                        isRequired
                                        maxLength={15}
                                        allowAlphabetsAndNumbersOnly
                                        convertToUppercase
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <SelectInput
                                        name="authenticationMode"
                                        label="Authentication Mode"
                                        placeholder="Select authentication mode"
                                        options={AUTHENTICATION_MODE_OPTIONS}
                                        size="large"
                                        isRequired
                                    />
                                </Col>
                            </Row>
                        </Flex>
                    </div>

                    <div className="rounded-2xl p-5 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                        <Flex vertical gap={16}>
                            <Typography.Text className="font-bold text-base">
                                Mandate Configuration
                            </Typography.Text>

                            <TextInput
                                name="amount"
                                label="Amount"
                                placeholder="Enter amount"
                                type="text"
                                size="large"
                                isRequired
                                allowNumbersAndDots
                                maxValue={10000000}
                                inputMode="decimal"
                            />

                            <SelectInput
                                name="amountRule"
                                label="Amount Rule"
                                placeholder="Select amount rule"
                                options={AMOUNT_RULE_OPTIONS}
                                size="large"
                                isRequired
                            />

                            <Row gutter={12}>
                                <Col xs={24} sm={12}>
                                    <SelectInput
                                        name="frequency"
                                        label="Frequency"
                                        placeholder="Select frequency"
                                        options={ENACH_FREQUENCY_OPTIONS}
                                        size="large"
                                        isRequired
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <SelectInput
                                        name="categoryCode"
                                        label="Category"
                                        placeholder="Select category"
                                        options={ENACH_CATEGORY_OPTIONS}
                                        size="large"
                                        isRequired
                                    />
                                </Col>
                            </Row>

                            <Row gutter={12}>
                                <Col xs={24} sm={12}>
                                    <DatePickerInput
                                        name="startDate"
                                        label="Mandate Start Date"
                                        placeholder="Choose Date"
                                        size="large"
                                        isRequired
                                        minDate={dayjs()}
                                        maxDate={dayjs().add(120,'day')}
                                        handleChange={(d:any) => setFieldValue('startDate', d)}
                                        classes='w-full'
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <DatePickerInput
                                        name="endDate"
                                        label="Mandate End Date"
                                        placeholder="Choose Date"
                                        size="large"
                                        isRequired
                                        minDate={dayjs(values.startDate) || dayjs()}
                                        handleChange={(d: any) => setFieldValue('endDate', d)}
                                        classes="w-full"
                                    />
                                </Col>
                            </Row>
                        </Flex>
                    </div>

                    <Flex gap={12} wrap="wrap">
                        <Button size="large" className="flex-1" onClick={onBack}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            size="large"
                            className="flex-1"
                            loading={loading}
                            onClick={() => handleSubmit()}
                        >
                            Proceed to Customer Authorisation
                        </Button>
                    </Flex>
                </Flex>
            </Form>
        )}
    </Formik>
);

export default ENachFormView;
