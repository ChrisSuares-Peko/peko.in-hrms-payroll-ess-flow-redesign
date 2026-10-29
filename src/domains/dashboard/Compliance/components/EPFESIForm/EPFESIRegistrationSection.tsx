import React from 'react';

import { Alert, Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { EPFESIFormValues } from './epfEsiTypes';

const { Text } = Typography;

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const EPFESIRegistrationSection: React.FC = () => {
    const { values } = useFormikContext<EPFESIFormValues>();
    const alreadyAllotted = values.reg_alreadyAllotted;
    const totalEmployees = parseInt(values.reg_totalEmployees, 10);

    let employeeAlert: { type: 'warning' | 'info'; message: string } | null = null;
    if (!Number.isNaN(totalEmployees)) {
        if (totalEmployees >= 20) {
            employeeAlert = { type: 'warning', message: 'EPF registration is mandatory for your establishment (20+ employees).' };
        } else if (totalEmployees >= 10) {
            employeeAlert = { type: 'info', message: 'ESI registration is mandatory for your establishment (10+ employees).' };
        }
    }

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">
                    EPF / ESI Registration or Activation
                </Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Provide details for EPF and/or ESI registration
                </Text>
            </Flex>

            <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="reg_alreadyAllotted"
                        label="EPF/ESI Numbers Allotted at Incorporation?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        isRequired
                        classes="w-full"
                    />
                </Col>

                {alreadyAllotted === 'Yes' && (
                    <>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="reg_epfCode"
                                label="EPF Code Number"
                                type="text"
                                placeholder="Enter EPF code"
                                convertToUppercase
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <TextInput
                                name="reg_esicCode"
                                label="ESIC Code Number"
                                type="text"
                                placeholder="Enter ESIC code"
                                convertToUppercase
                            />
                        </Col>
                    </>
                )}

                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_totalEmployees"
                        label="Total Number of Employees"
                        type="text"
                        placeholder="Enter count"
                        allowNumbersOnly
                        isRequired
                    />
                    {employeeAlert && (
                        <div className="mt-2">
                            <Alert type={employeeAlert.type} message={employeeAlert.message} showIcon />
                        </div>
                    )}
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_empBelow15k"
                        label="Employees with wages ≤ ₹15,000"
                        type="text"
                        placeholder="Enter count"
                        allowNumbersOnly
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_empBelow21k"
                        label="Employees with wages ≤ ₹21,000"
                        type="text"
                        placeholder="Enter count"
                        allowNumbersOnly
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <DatePickerInput
                        name="reg_thresholdDate"
                        label="Date Threshold Crossed"
                        placeholder="Select date"
                        classes="w-full"
                        formItemClass="w-full"
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <SelectInputWithSearch
                        name="reg_voluntaryEpf"
                        label="Voluntary EPF Coverage Required?"
                        placeholder="Select"
                        options={YES_NO_OPTIONS}
                        classes="w-full"
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <DatePickerInput
                        name="reg_coverageDate"
                        label="Coverage Start Date"
                        placeholder="Select date"
                        classes="w-full"
                        formItemClass="w-full"
                    />
                </Col>

                <Col xs={24} sm={12}>
                    <TextInput
                        name="reg_natureOfBusiness"
                        label="Nature of Business"
                        type="text"
                        placeholder="e.g. Manufacturing, IT Services"
                        isRequired
                    />
                </Col>
            </Row>
        </div>
    );
};

export default EPFESIRegistrationSection;
