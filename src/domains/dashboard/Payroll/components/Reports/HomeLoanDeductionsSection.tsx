import React from 'react';

import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { Flex, Typography, Row, Col, Button } from 'antd';
import { FieldArray, FieldArrayRenderProps } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

// Define home loan deduction type
interface HomeLoanDeduction {
    deductionType: string;
    amountClaimed: string;
    institutionName: string;
    certificationDate: string;
    proof: string;
}

// Define Formik values interface
interface FormValues {
    homeLoanDeductions: HomeLoanDeduction[];
}

interface HomeLoanDeductionsSectionProps {
    values: FormValues;
}

const HomeLoanDeductionsSection: React.FC<HomeLoanDeductionsSectionProps> = ({ values }) => (
    <Flex gap={15} vertical className="rounded-lg border border-[#EAEAEA] xs:p-3 md:p-6 mt-4">
        <FieldArray name="homeLoanDeductions">
            {({ push, remove }: FieldArrayRenderProps) => (
                <>
                    <Flex justify="space-between" align="center">
                        <Typography.Text className="text-[#1B1B1B] font-medium text-[1.1rem]">
                            Deduction of Interest on Home Loan - Section 24(b)
                        </Typography.Text>
                        <Button
                            danger
                            icon={<PlusOutlined />}
                            onClick={() =>
                                push({
                                    deductionType: '',
                                    amountClaimed: '',
                                    institutionName: '',
                                    certificationDate: '',
                                    proof: '',
                                })
                            }
                        >
                            Add New Deduction
                        </Button>
                    </Flex>

                    {values.homeLoanDeductions.map((_, index) => (
                        <Flex key={index} gap={15} vertical>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <SelectInput
                                        name={`homeLoanDeductions[${index}].deductionType`}
                                        label="Select Deduction Type"
                                        placeholder="Select"
                                        options={[
                                            {
                                                label: 'Home Loan Interest',
                                                value: 'homeLoanInterest',
                                            },
                                            {
                                                label: 'Principal Repayment',
                                                value: 'principalRepayment',
                                            },
                                        ]}
                                        isRequired
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <TextInput
                                        name={`homeLoanDeductions[${index}].amountClaimed`}
                                        label="Amount Claimed"
                                        type="text"
                                        placeholder="Enter"
                                        isRequired
                                        allowNumbersAndDots
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <TextInput
                                        name={`homeLoanDeductions[${index}].institutionName`}
                                        label="Name of the Institution/Organization"
                                        type="text"
                                        placeholder="Enter"
                                        isRequired
                                        allowAlphabetsAndSpaceOnly
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <DatePickerInput
                                        name={`homeLoanDeductions[${index}].certificationDate`}
                                        label="Date of Certification"
                                        placeholder="Select Date"
                                        isRequired
                                        classes="w-full"
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <FileUploadInput
                                        label="Upload Proof/Receipt"
                                        name={`homeLoanDeductions[${index}].proof`}
                                        format="supportingDocFormat"
                                        showNotification
                                        showFileName
                                        allowedFileTypes={['image/jpeg', 'image/png']}
                                        maxFileSize={200}
                                        descriptionText="File Formats Supported: JPG, JPEG, PNG. Max. size: 200 KB"
                                    />
                                </Col>
                            </Row>
                            {index !== 0 && (
                                <Button
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => remove(index)}
                                    className="self-start"
                                >
                                    Remove
                                </Button>
                            )}
                        </Flex>
                    ))}
                </>
            )}
        </FieldArray>
    </Flex>
);

export default HomeLoanDeductionsSection;
