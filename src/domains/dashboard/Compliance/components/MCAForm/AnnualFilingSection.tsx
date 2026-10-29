import React from 'react';

import { Alert, Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { MCAFormValues } from './mcaTypes';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const AnnualFilingSection: React.FC = () => {
    const { values } = useFormikContext<MCAFormValues>();
    const showAuditDate = values.annual_accountsAudited === 'No';

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">
                    Annual Filing — AOC-4 / MGT-7
                </Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Provide details for your annual return and financial statement filing
                </Text>
            </Flex>

            <Alert
                type="info"
                showIcon
                message="AOC-4 is due within 30 days after AGM; MGT-7 / MGT-7A is due within 60 days after AGM."
                className="mb-5 !rounded-[12px]"
            />

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="annual_financialYear"
                        label="Financial Year"
                        type="text"
                        placeholder="e.g. 2024-25"
                        isRequired
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <DatePickerInput
                        name="annual_agmDate"
                        label="AGM Date"
                        placeholder="Select AGM date"
                        classes="w-full"
                        formItemClass="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="annual_accountsAudited"
                        label="Accounts Audited?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>
                {showAuditDate && (
                    <Col xs={24} sm={12}>
                        <DatePickerInput
                            name="annual_expectedAuditDate"
                            label="Expected Audit Completion Date"
                            placeholder="Select date"
                            classes="w-full"
                            formItemClass="w-full"
                        />
                    </Col>
                )}
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="annual_isFirstFiling"
                        label="First Filing?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="annual_isSmallCompany"
                        label="Small Company?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <TextInput
                        name="annual_boardMeetingsCount"
                        label="Number of Board Meetings Held"
                        type="text"
                        placeholder="Enter count"
                        allowNumbersOnly
                    />
                </Col>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="annual_hasChanges"
                        label="Changes in Directors / Shareholding?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>
            </Row>
        </div>
    );
};

export default AnnualFilingSection;
