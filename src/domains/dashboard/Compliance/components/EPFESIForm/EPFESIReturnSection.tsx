import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { EPFESIFormValues } from './epfEsiTypes';

const { Text } = Typography;

const RETURN_TYPE_OPTIONS = [
    { label: 'EPF Monthly ECR', value: 'EPF_MONTHLY_ECR' },
    { label: 'EPF Annual Return', value: 'EPF_ANNUAL' },
    { label: 'ESI Monthly Return', value: 'ESI_MONTHLY' },
    { label: 'ESI Half-Yearly Return', value: 'ESI_HALF_YEARLY' },
];

const DATA_SOURCE_OPTIONS = [
    { label: 'Software', value: 'Software' },
    { label: 'Excel', value: 'Excel' },
];

const EPFESIReturnSection: React.FC = () => {
    const { values } = useFormikContext<EPFESIFormValues>();

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">
                    EPF / ESI Return Filing
                </Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Provide details for the return period and wage data
                </Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="ret_returnType"
                        label="Return Type"
                        placeholder="Select return type"
                        options={RETURN_TYPE_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                    {values.ret_returnType && (
                        <div className="mt-1 mb-2">
                            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                Monthly dues payable by 15th of following month
                            </Text>
                        </div>
                    )}
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_period"
                        label="Month / Period"
                        type="text"
                        placeholder="e.g. June 2025 or Apr–Sep 2025"
                        isRequired
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_financialYear"
                        label="Financial Year"
                        type="text"
                        placeholder="e.g. 2024-25"
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_employeeCount"
                        label="Number of Employees"
                        type="text"
                        placeholder="Enter count"
                        allowNumbersOnly
                        isRequired
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_totalWages"
                        label="Total Wages (₹)"
                        type="text"
                        placeholder="Enter total wage amount"
                        allowNumbersOnly
                        isRequired
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="ret_joinerExits"
                        label="New Joiners / Exits"
                        type="text"
                        placeholder="e.g. 3 joiners, 1 exit"
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="ret_dataSource"
                        label="Data Source"
                        placeholder="Select data source"
                        options={DATA_SOURCE_OPTIONS}
                        classes="w-full"
                    />
                </Col>
            </Row>
        </div>
    );
};

export default EPFESIReturnSection;
