import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import MultiSelectInput from '@src/components/atomic/inputs/MultiSelectInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { TDSFormValues } from './tdsTypes';

const { Text } = Typography;

const QUARTER_OPTIONS = [
    { label: 'Q1 (Apr – Jun)', value: 'Q1' },
    { label: 'Q2 (Jul – Sep)', value: 'Q2' },
    { label: 'Q3 (Oct – Dec)', value: 'Q3' },
    { label: 'Q4 (Jan – Mar)', value: 'Q4' },
];

const QUARTER_DUE_DATES: Record<string, string> = {
    Q1: '31 July',
    Q2: '31 October',
    Q3: '31 January',
    Q4: '31 May',
};

const RETURN_TYPE_OPTIONS = [
    { label: 'Form 24Q (Salary)', value: 'FORM_24Q' },
    { label: 'Form 26Q (Resident Non-Salary)', value: 'FORM_26Q' },
    { label: 'Form 27Q (Non-Resident)', value: 'FORM_27Q' },
    { label: 'Form 27EQ (TCS)', value: 'FORM_27EQ' },
    { label: 'Nil Return', value: 'NIL' },
];

const PAYMENT_NATURE_OPTIONS = [
    { label: '194C – Contractor', value: '194C' },
    { label: '194J – Professional Fees', value: '194J' },
    { label: '194I – Rent', value: '194I' },
    { label: '194A – Interest', value: '194A' },
    { label: '194H – Commission', value: '194H' },
    { label: '194T – Partner Payments', value: '194T' },
];

const DATA_SOURCE_OPTIONS = [
    { label: 'Payroll', value: 'Payroll' },
    { label: 'Accounting Software', value: 'Accounting Software' },
    { label: 'Excel', value: 'Excel' },
];

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const TDSReturnSection: React.FC = () => {
    const { values } = useFormikContext<TDSFormValues>();
    const isNil = values.ret_returnTypes.includes('NIL');
    const dueDate = values.ret_quarter ? QUARTER_DUE_DATES[values.ret_quarter] : null;

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">TDS Return Filing</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Quarterly filing required for all entities with a valid TAN
                </Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_tan"
                        label="TAN Number"
                        type="text"
                        placeholder="e.g. ABCD12345E"
                        isRequired
                        convertToUppercase
                        maxLength={10}
                    />
                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] -mt-3 mb-2 block">
                        Format: 4 letters + 5 digits + 1 letter (e.g. ABCD12345E)
                    </Text>
                </Col>

                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="ret_quarter"
                        label="Quarter"
                        placeholder="Select quarter"
                        options={QUARTER_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                    {dueDate && (
                        <Text className="!text-[11px] !text-[#ff4f4f] -mt-3 mb-2 block">
                            Due date: {dueDate}
                        </Text>
                    )}
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_financialYear"
                        label="Financial Year"
                        type="text"
                        placeholder="e.g. 2024-25"
                        isRequired
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <MultiSelectInput
                        name="ret_returnTypes"
                        label="Return Types"
                        placeholder="Select form types"
                        options={RETURN_TYPE_OPTIONS}
                    />
                </Col>

                {!isNil && (
                    <Col xs={24} sm={12}>
                        <MultiSelectInput
                            name="ret_paymentNatures"
                            label="Nature of Payments"
                            placeholder="Select sections"
                            options={PAYMENT_NATURE_OPTIONS}
                        />
                    </Col>
                )}
            </Row>

            {isNil && (
                <div className="bg-[#fafafa] rounded-[12px] p-4 mt-2 border border-[#f0f0f0]">
                    <Text className="!text-[13px] !text-[#475569]">
                        Nil Return selected — no additional payment or deductee details required.
                    </Text>
                </div>
            )}

            {!isNil && (
                <div className="border-t border-[#f0f0f0] mt-4 pt-4">
                        <Text className="!text-[13px] !font-semibold !text-[#314259] block mb-3">
                            Summary Details
                        </Text>
                        <Row gutter={[16, 0]}>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="ret_deducteeCount"
                                    label="Number of Deductees"
                                    type="text"
                                    placeholder="Enter count"
                                    allowNumbersOnly
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="ret_totalAmount"
                                    label="Total Amount Paid/Credited (₹)"
                                    type="text"
                                    placeholder="Enter total amount"
                                    allowNumbersOnly
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="ret_totalTds"
                                    label="Total TDS Deducted (₹)"
                                    type="text"
                                    placeholder="Enter total TDS"
                                    allowNumbersOnly
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <SelectInputWithSearch
                                    name="ret_dataSource"
                                    label="Data Source"
                                    placeholder="Select source"
                                    options={DATA_SOURCE_OPTIONS}
                                    classes="w-full"
                                />
                            </Col>
                            <Col xs={24}>
                                <TextAreaInput
                                    name="ret_challanDetails"
                                    label="TDS Challan Details"
                                    placeholder="Enter BSR code, challan serial no., date, and amount for each challan"
                                    minRows={4}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <SelectInputWithSearch
                                    name="ret_form16Required"
                                    label="Form 16/16A Required?"
                                    placeholder="Select"
                                    options={YES_NO_OPTIONS}
                                    classes="w-full"
                                />
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] -mt-3 mb-2 block">
                                    Form 16/16A generated after TRACES processing
                                </Text>
                            </Col>
                        </Row>
                </div>
            )}
        </div>
    );
};

export default TDSReturnSection;
