import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, InputNumber, Row, Skeleton, Typography } from 'antd';
import { ErrorMessage, FieldArray, FieldArrayRenderProps, Formik } from 'formik';
import { ReactSVG } from 'react-svg';

import SelectInput from '@components/atomic/inputs/SelectInput';
import add from '@domains/dashboard/Invoice/assets/add.svg';

type IncomeSlab = {
    incomeStartRange: number | string;
    incomeEndRange: number | string;
    taxAmount: number | string;
};

type FormValues = {
    deductionCycle: string;
    employeeContribution: number;
    employerContribution: number;
    incomeSlabs: IncomeSlab[];
};

type Props = {
    nextTab?: (key: string) => void;
};

const ProfessionalTax = ({ nextTab }: Props) => {
    const isLoading = false;
    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical className="my-8">
            <Formik<FormValues>
                initialValues={{
                    deductionCycle: '',
                    employeeContribution: 0,
                    employerContribution: 0,
                    incomeSlabs: [
                        {
                            incomeStartRange: '',
                            incomeEndRange: '',
                            taxAmount: '',
                        },
                    ],
                }}
                onSubmit={() => {}}
            >
                {({ handleSubmit, values, setFieldValue }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Flex justify="center">
                            <Col span={16}>
                                <Row>
                                    <Col xs={24} sm={10} className="mx-auto" />

                                    <Col xs={24} sm={10} className="ml-8 mt-4">
                                        <Typography.Text className="font-medium">
                                            Other Configurations
                                        </Typography.Text>
                                    </Col>

                                    <Col xs={24} sm={22} className="mx-auto">
                                        <>
                                            <Row>
                                                <Col className="min-w-[26rem]">
                                                    <SelectInput
                                                        label="State"
                                                        name="state"
                                                        placeholder="Select state"
                                                        isRequired
                                                        options={[
                                                            {
                                                                key: 1,
                                                                value: 'OLDTAXREGIME',
                                                                label: 'Old Tax Regime',
                                                            },
                                                        ]}
                                                        allowClear
                                                    />
                                                </Col>
                                            </Row>
                                            <Row>
                                                <Col className="max-w-[27rem]">
                                                    <Row
                                                        className="mt-8 bg-[#F5F5F5] p-3"
                                                        gutter={[20, 0]}
                                                    >
                                                        <Col xs={24} md={8}>
                                                            <Typography.Text>
                                                                Income Start Range (₹)
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col xs={24} md={8}>
                                                            <Typography.Text>
                                                                Income End Range (₹)
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col xs={24} md={8}>
                                                            <Typography.Text>
                                                                Tax Amount (₹)
                                                            </Typography.Text>
                                                        </Col>
                                                    </Row>
                                                    <FieldArray name="incomeSlabs">
                                                        {({
                                                            push,
                                                            remove,
                                                        }: FieldArrayRenderProps) => (
                                                            <>
                                                                {values.incomeSlabs.map(
                                                                    (
                                                                        _: IncomeSlab,
                                                                        index: number
                                                                    ) => (
                                                                        <React.Fragment key={index}>
                                                                            <Row
                                                                                className="mt-6"
                                                                                gutter={[16, 0]}
                                                                                align="middle"
                                                                            >
                                                                                <Col xs={24} md={7}>
                                                                                    <InputNumber
                                                                                        name={`incomeSlabs[${index}].incomeStartRange`}
                                                                                        type="number"
                                                                                        placeholder="Enter start range"
                                                                                        size="middle"
                                                                                        className="w-full"
                                                                                        value={Number(
                                                                                            values
                                                                                                .incomeSlabs[
                                                                                                index
                                                                                            ]
                                                                                                .incomeStartRange
                                                                                        )}
                                                                                        min={0}
                                                                                        onChange={value =>
                                                                                            setFieldValue(
                                                                                                `incomeSlabs[${index}].incomeStartRange`,
                                                                                                value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    <ErrorMessage
                                                                                        name={`incomeSlabs[${index}].incomeStartRange`}
                                                                                        render={msg => (
                                                                                            <div className="error-message -mt-6 text-red-500">
                                                                                                {
                                                                                                    msg
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    />
                                                                                </Col>
                                                                                <Col xs={24} md={7}>
                                                                                    <InputNumber
                                                                                        name={`incomeSlabs[${index}].incomeEndRange`}
                                                                                        type="number"
                                                                                        placeholder="Enter end range"
                                                                                        size="middle"
                                                                                        value={Number(
                                                                                            values
                                                                                                .incomeSlabs[
                                                                                                index
                                                                                            ]
                                                                                                .incomeEndRange
                                                                                        )}
                                                                                        min={0}
                                                                                        className="w-full"
                                                                                        onChange={value =>
                                                                                            setFieldValue(
                                                                                                `incomeSlabs[${index}].incomeEndRange`,
                                                                                                value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    <ErrorMessage
                                                                                        name={`incomeSlabs[${index}].incomeEndRange`}
                                                                                        render={msg => (
                                                                                            <div className="error-message -mt-6 text-red-500">
                                                                                                {
                                                                                                    msg
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    />
                                                                                </Col>
                                                                                <Col xs={24} md={7}>
                                                                                    <InputNumber
                                                                                        name={`incomeSlabs[${index}].taxAmount`}
                                                                                        type="number"
                                                                                        placeholder="Enter tax amount"
                                                                                        size="middle"
                                                                                        className="w-full"
                                                                                        value={Number(
                                                                                            values
                                                                                                .incomeSlabs[
                                                                                                index
                                                                                            ]
                                                                                                .taxAmount
                                                                                        )}
                                                                                        onChange={value =>
                                                                                            setFieldValue(
                                                                                                `incomeSlabs[${index}].taxAmount`,
                                                                                                value
                                                                                            )
                                                                                        }
                                                                                        min={0}
                                                                                    />
                                                                                    <ErrorMessage
                                                                                        name={`incomeSlabs[${index}].taxAmount`}
                                                                                        render={msg => (
                                                                                            <div className="error-message -mt-6 text-red-500">
                                                                                                {
                                                                                                    msg
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    />
                                                                                </Col>
                                                                                <Col xs={24} md={2}>
                                                                                    <Button
                                                                                        className="p-0 m-0"
                                                                                        icon={
                                                                                            <CloseOutlined />
                                                                                        }
                                                                                        onClick={() =>
                                                                                            remove(
                                                                                                index
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            index ===
                                                                                            0
                                                                                        }
                                                                                    />
                                                                                </Col>
                                                                            </Row>
                                                                        </React.Fragment>
                                                                    )
                                                                )}
                                                                <Flex
                                                                    gap={3}
                                                                    justify="space-between w-full"
                                                                >
                                                                    <ReactSVG
                                                                        className="mt-7"
                                                                        src={add}
                                                                    />
                                                                    <Typography.Text
                                                                        className="text-bgOrange2 mt-6 cursor-pointer"
                                                                        onClick={() =>
                                                                            push({
                                                                                incomeStartRange:
                                                                                    '',
                                                                                incomeEndRange: '',
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
                                            </Row>
                                        </>
                                    </Col>

                                    <Col md={22} className="mx-auto">
                                        <Flex justify="space-between" className="mt-11">
                                            <Button
                                                type="default"
                                                danger
                                                className="font-semibold w-[8rem]"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                htmlType="submit"
                                                type="primary"
                                                danger
                                                className="font-semibold w-[8rem]"
                                            >
                                                Next
                                            </Button>
                                        </Flex>
                                    </Col>
                                </Row>
                            </Col>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default ProfessionalTax;
