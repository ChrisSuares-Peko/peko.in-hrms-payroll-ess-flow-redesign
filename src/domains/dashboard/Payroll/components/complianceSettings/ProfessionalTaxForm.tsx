import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Col, Flex, InputNumber, Row, Typography } from 'antd';
import { FieldArray, FieldArrayRenderProps, ErrorMessage } from 'formik';
import { ReactSVG } from 'react-svg';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import add from '@domains/dashboard/Invoice/assets/add.svg';

type AdditionalSlab = {
    startRange: string;
    endRange: string;
    taxAmount: string;
};

type ProfessionalTaxFormProps = {
    additionalSlab: AdditionalSlab[];
};

const ProfessionalTaxForm: React.FC<ProfessionalTaxFormProps> = ({ additionalSlab }) => (
    <Col>
        <SelectInput
            name="state"
            options={[]}
            placeholder="Select state"
            label="State"
            isRequired
        />
        <TextInput
            name="PT Number"
            type="text"
            placeholder="Enter PT Number"
            label="PT Number"
            isRequired
            allowNumbersOnly
            maxLength={6}
        />
        <SelectInput
            name="deductionCycle"
            options={[]}
            placeholder="Select deduction cycle"
            label="Deduction Cycle"
            isRequired
        />
        <Row className="mt-8 bg-[#F5F5F5] p-1" gutter={[16, 0]} align="middle">
            <Col xs={24} md={7}>
                <Typography.Text>Income Start Range (₹)</Typography.Text>
            </Col>
            <Col xs={24} md={7}>
                <Typography.Text>Income End Range (₹)</Typography.Text>
            </Col>
            <Col xs={24} md={7}>
                <Typography.Text>Tax Amount (₹)</Typography.Text>
            </Col>
        </Row>

        <FieldArray name="additionalSlab">
            {({ push, remove }: FieldArrayRenderProps) => (
                <>
                    {/* Loop through each slab */}
                    {additionalSlab.map((_, index) => (
                        <React.Fragment key={index}>
                            <Row className="mt-6" gutter={[16, 0]} align="middle">
                                <Col xs={24} md={7}>
                                    <InputNumber
                                        name={`additionalSlab[${index}].startRange`}
                                        type="number"
                                        placeholder="Enter start range"
                                        size="middle"
                                        className="w-full"
                                    />
                                    <ErrorMessage
                                        name={`additionalSlab[${index}].startRange`}
                                        render={msg => (
                                            <div className="error-message -mt-6 text-red-500">
                                                {msg}
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} md={7}>
                                    <InputNumber
                                        name={`additionalSlab[${index}].endRange`}
                                        type="number"
                                        placeholder="Enter end range"
                                        size="middle"
                                        className="w-full"
                                    />
                                    <ErrorMessage
                                        name={`additionalSlab[${index}].endRange`}
                                        render={msg => (
                                            <div className="error-message -mt-6 text-red-500">
                                                {msg}
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} md={7}>
                                    <InputNumber
                                        name={`additionalSlab[${index}].taxAmount`}
                                        type="number"
                                        placeholder="Enter tax amount"
                                        size="middle"
                                        className="w-full"
                                    />
                                    <ErrorMessage
                                        name={`additionalSlab[${index}].taxAmount`}
                                        render={msg => (
                                            <div className="error-message -mt-6 text-red-500">
                                                {msg}
                                            </div>
                                        )}
                                    />
                                </Col>
                                <Col xs={24} md={2}>
                                    <Button
                                        className="p-0 m-0"
                                        icon={<CloseOutlined />}
                                        onClick={() => remove(index)}
                                        disabled={index === 0}
                                    />
                                </Col>
                            </Row>
                        </React.Fragment>
                    ))}

                    {/* Add New Slab Button */}
                    <Flex gap={3} justify="space-between w-full">
                        <ReactSVG className="mt-4" src={add} />

                        <Typography.Text
                            className=" text-bgOrange2 mt-3 "
                            onClick={() =>
                                push({
                                    startRange: '',
                                    endRange: '',
                                    taxAmount: '',
                                })
                            }
                        >
                            Additional Slab
                        </Typography.Text>
                    </Flex>
                </>
            )}
        </FieldArray>
    </Col>
);

export default ProfessionalTaxForm;
