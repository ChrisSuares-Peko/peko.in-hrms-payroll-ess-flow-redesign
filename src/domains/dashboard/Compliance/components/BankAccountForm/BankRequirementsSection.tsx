import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import CheckboxInput from '@src/components/atomic/inputs/CheckboxInput';
import MultiSelectInput from '@src/components/atomic/inputs/MultiSelectInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

const PREFERRED_BANK_OPTIONS = [
    { label: 'SBI', value: 'SBI' },
    { label: 'HDFC', value: 'HDFC' },
    { label: 'ICICI', value: 'ICICI' },
    { label: 'Axis', value: 'Axis' },
    { label: 'Kotak', value: 'Kotak' },
    { label: 'Yes Bank', value: 'Yes Bank' },
    { label: 'Other', value: 'Other' },
];

const ACCOUNT_TYPE_OPTIONS = [
    { label: 'Current', value: 'Current' },
    { label: 'Savings', value: 'Savings' },
    { label: 'Escrow', value: 'Escrow' },
    { label: 'Other', value: 'Other' },
];

const ADDITIONAL_FACILITIES_OPTIONS = [
    { label: 'Cheque Book', value: 'Cheque Book' },
    { label: 'Debit Card', value: 'Debit Card' },
    { label: 'Net Banking', value: 'Net Banking' },
    { label: 'UPI / Payment Gateway', value: 'UPI / Payment Gateway' },
    { label: 'OD / CC Limit', value: 'OD / CC Limit' },
];

const MODE_OF_OPERATION_OPTIONS = [
    { label: 'Singly', value: 'Singly' },
    { label: 'Jointly', value: 'Jointly' },
    { label: 'Either-or-Survivor', value: 'Either-or-Survivor' },
    { label: 'As per Board Resolution', value: 'As per Board Resolution' },
];

const BankRequirementsSection: React.FC = () => (
    <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
        <Flex vertical gap={4} className="mb-5">
            <Text className="!text-[14px] !font-semibold !text-black">Bank Account Requirements</Text>
            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Specify preferences and requirements for the bank account</Text>
        </Flex>

        <Flex vertical gap={0}>
            <Row gutter={[16, 0]}>
                <Col xs={24}>
                    <MultiSelectInput
                        name="bank_preferredBanks"
                        label="Preferred Banks"
                        placeholder="Select banks"
                        options={PREFERRED_BANK_OPTIONS}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="bank_accountType"
                        label="Account Type"
                        placeholder="Select account type"
                        options={ACCOUNT_TYPE_OPTIONS}
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="bank_preferredBranch"
                        label="Preferred Branch"
                        type="text"
                        placeholder="Enter preferred branch location"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="bank_initialDeposit"
                        label="Initial Deposit Amount (₹)"
                        type="text"
                        placeholder="Enter amount"
                        allowNumbersOnly
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="bank_monthlyVolume"
                        label="Expected Monthly Transaction Volume (₹)"
                        type="text"
                        placeholder="Enter amount"
                        allowNumbersOnly
                    />
                </Col>
                <Col xs={24}>
                    <MultiSelectInput
                        name="bank_additionalFacilities"
                        label="Additional Facilities Required"
                        placeholder="Select facilities"
                        options={ADDITIONAL_FACILITIES_OPTIONS}
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="bank_modeOfOperation"
                        label="Mode of Operation"
                        placeholder="Select mode"
                        options={MODE_OF_OPERATION_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="bank_operatingSignatories"
                        label="Operating Signatories"
                        type="text"
                        placeholder="e.g. Any two directors jointly"
                    />
                </Col>
            </Row>

            <Flex vertical gap={12} className="mt-2">
                <CheckboxInput name="bank_boardResolutionRequired">
                    Board Resolution required for account opening
                </CheckboxInput>
                <CheckboxInput name="bank_hasExistingResolution">
                    Existing Board Resolution available
                </CheckboxInput>
                <CheckboxInput name="bank_beneficialOwnershipRequired">
                    Beneficial Ownership Declaration required
                </CheckboxInput>
                <CheckboxInput name="bank_kycEnclosed">
                    KYC documents enclosed
                </CheckboxInput>
            </Flex>
        </Flex>
    </div>
);

export default BankRequirementsSection;
