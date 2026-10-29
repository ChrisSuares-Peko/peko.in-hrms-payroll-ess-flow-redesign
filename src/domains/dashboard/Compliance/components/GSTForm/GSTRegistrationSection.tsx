import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { GSTFormValues } from './gstTypes';
import useIndianStates from '../../hooks/useIndianStates';

const { Text } = Typography;

const REASON_OPTIONS = [
    { label: 'Threshold Turnover Exceeded', value: 'Threshold' },
    { label: 'Inter-state Supply', value: 'Inter-state Supply' },
    { label: 'E-commerce Operator / Supplier', value: 'E-commerce' },
    { label: 'Voluntary Registration', value: 'Voluntary' },
    { label: 'Reverse Charge Mechanism (RCM)', value: 'RCM' },
    { label: 'Other', value: 'Other' },
];

const NATURE_OPTIONS = [
    { label: 'Regular Taxpayer', value: 'Regular' },
    { label: 'Composition Scheme', value: 'Composition Scheme' },
];

const GSTRegistrationSection: React.FC = () => {
    const { values } = useFormikContext<GSTFormValues>();
    const { stateOptions, isLoading: statesLoading } = useIndianStates();

    if (!values.gst_selectedTypes.includes('GST_REG')) return null;

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">New GST Registration</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Provide details required for GST registration
                </Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="reg_reason"
                        label="Reason for Registration"
                        placeholder="Select reason"
                        options={REASON_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="reg_nature"
                        label="Nature of Registration"
                        placeholder="Select type"
                        options={NATURE_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_expectedTurnover"
                        label="Expected Annual Turnover (₹)"
                        type="text"
                        placeholder="Enter expected turnover"
                        isRequired
                        allowTwoDecimalsOnly
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="reg_state"
                        label="State of Registration"
                        placeholder="Select state"
                        options={stateOptions}
                        loading={statesLoading}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_principalAddress"
                        label="Principal Place of Business"
                        type="text"
                        placeholder="Enter full address"
                        isRequired
                        allowAlphabetsSpaceAndNumbersOnly
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_additionalAddress"
                        label="Additional Place of Business (optional)"
                        type="text"
                        placeholder="Enter additional address if any"
                        allowAlphabetsSpaceAndNumbersOnly
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <DatePickerInput
                        name="reg_liabilityDate"
                        label="Liability Date"
                        placeholder="Select date"
                        isRequired
                        classes="w-full"
                        formItemClass="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_bankAccountNo"
                        label="Bank Account Number"
                        type="text"
                        placeholder="Enter bank account number"
                        isRequired
                        allowNumbersOnly
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_ifscCode"
                        label="IFSC Code"
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        isRequired
                        convertToUppercase
                        maxLength={11}
                        allowUpperCaseOnly
                        allowAlphabetsAndNumbersOnly
                    />
                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)] !-mt-3 block mb-2">
                        Format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)
                    </Text>
                </Col>
                <Col xs={24} sm={12}>
                    {/* spacer for grid alignment */}
                </Col>
                <Col xs={24} sm={12}>
                    <TextAreaInput
                        name="reg_hsnGoods"
                        label="Main Goods Supplied (with HSN Codes)"
                        placeholder="e.g. Electronic Components - HSN 8542"
                        minRows={3}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextAreaInput
                        name="reg_sacServices"
                        label="Main Services Supplied (with SAC Codes)"
                        placeholder="e.g. IT Services - SAC 998313"
                        minRows={3}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default GSTRegistrationSection;
