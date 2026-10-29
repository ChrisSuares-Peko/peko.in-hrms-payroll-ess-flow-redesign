import React from 'react';

import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { Flex, Typography, Row, Col, Button } from 'antd';
import { FieldArray, FieldArrayRenderProps } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

// Define deduction type
interface Deduction {
    investmentType: string;
    amountInvested: string;
    proof: string;
}

// Define Formik values interface
interface FormValues {
    chapterVIA: Deduction[];
}

interface ChapterVIADeductionsSectionProps {
    values: FormValues;
}

const ChapterVIADeductionsSection: React.FC<ChapterVIADeductionsSectionProps> = ({ values }) => (
    <Flex gap={15} vertical className="rounded-lg border border-[#EAEAEA] xs:p-3 md:p-6 mt-4">
        <FieldArray name="chapterVIA">
            {({ push, remove }: FieldArrayRenderProps) => (
                <>
                    <Flex justify="space-between" align="center">
                        <div>
                            <Typography.Text className="text-[#1B1B1B] font-medium text-[1.1rem]">
                                Deductions Under Chapter VI-A
                            </Typography.Text>
                            <Typography.Paragraph className="text-[#6B7280] text-[0.9rem] mt-1">
                                This section covers various deductions claimed under Chapter VI-A.
                            </Typography.Paragraph>
                        </div>
                        <Button
                            danger
                            icon={<PlusOutlined />}
                            onClick={() =>
                                push({
                                    investmentType: '',
                                    amountInvested: '',
                                    proof: '',
                                })
                            }
                        >
                            Add New
                        </Button>
                    </Flex>

                        <Flex gap={15} vertical>
                            <Typography.Text className="text-[#1B1B1B] font-medium text-[1rem]">
                                A. Section 80C: Investments in Savings/ Insurance
                            </Typography.Text>
                    {values.chapterVIA.map((_, index) => (
                            <>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <SelectInput
                                        name={`chapterVIA[${index}].investmentType`}
                                        label="Investment Type"
                                        placeholder="Select"
                                        options={[
                                            { label: 'PPF', value: 'ppf' },
                                            { label: 'NSC', value: 'nsc' },
                                            { label: 'LIC', value: 'lic' },
                                            { label: 'ELSS', value: 'elss' },
                                        ]}
                                        isRequired
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <TextInput
                                        name={`chapterVIA[${index}].amountInvested`}
                                        label="Amount Invested"
                                        type="text"
                                        placeholder="Enter"
                                        isRequired
                                        allowTwoDecimalsOnly
                                        maxLength={10}
                                    />
                                </Col>
                                <Col xs={24} md={12}>
                                    <FileUploadInput
                                        label="Upload Proof"
                                        name={`chapterVIA[${index}].proof`}
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
                            )}</>))}
                        </Flex>
                    
                </>
            )}
        </FieldArray>
    </Flex>
);

export default ChapterVIADeductionsSection;
