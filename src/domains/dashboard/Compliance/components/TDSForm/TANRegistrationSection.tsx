import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { TDSFormValues } from './tdsTypes';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const DEDUCTION_REASON_OPTIONS = [
    { label: 'Salary', value: 'Salary' },
    { label: 'Contractor', value: 'Contractor' },
    { label: 'Professional Fees', value: 'Professional Fees' },
    { label: 'Rent', value: 'Rent' },
    { label: 'Interest', value: 'Interest' },
    { label: 'Commission', value: 'Commission' },
];

const TANRegistrationSection: React.FC = () => {
    const { values } = useFormikContext<TDSFormValues>();
    const hasTan = values.tan_hasTan === 'Yes';

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">TAN Registration</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Required for all entities deducting or collecting tax at source
                </Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="tan_hasTan"
                        label="Company Already Has TAN?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>

                {hasTan && (
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="tan_existingTan"
                            label="Existing TAN Number"
                            type="text"
                            placeholder="e.g. ABCD12345E"
                            convertToUppercase
                            maxLength={10}
                        />
                    </Col>
                )}

                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="tan_deductionReason"
                        label="Reason for TDS Deduction"
                        placeholder="Select reason"
                        options={DEDUCTION_REASON_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>

                <Col xs={24} sm={hasTan ? 12 : 12}>
                    <TextInput
                        name="tan_address"
                        label="Address for TAN"
                        type="text"
                        placeholder="Enter address"
                        isRequired
                    />
                </Col>
            </Row>

            {/* Person Responsible for TDS */}
            <div className="border-t border-[#f0f0f0] mt-4 pt-4">
                <Text className="!text-[13px] !font-semibold !text-[#314259] block mb-3">
                    Person Responsible for TDS
                </Text>
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="tan_personName"
                            label="Name"
                            type="text"
                            placeholder="Enter full name"
                            isRequired
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="tan_personDesignation"
                            label="Designation"
                            type="text"
                            placeholder="e.g. CFO, Accountant"
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="tan_personPan"
                            label="PAN"
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            convertToUppercase
                            maxLength={10}
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="tan_personMobile"
                            label="Mobile"
                            type="text"
                            placeholder="10-digit mobile"
                            allowNumbersOnly
                            maxLength={10}
                            addonBefore="+91"
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="tan_personEmail"
                            label="Email"
                            type="email"
                            placeholder="Enter email address"
                        />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default TANRegistrationSection;
