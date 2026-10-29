import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { ErrorMessage, FieldArray } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

type Props = {
    values: { key: string; value: string }[];
};

const OptionalForm = ({ values }: Props) => (
    <Flex vertical justify="end" gap={20}>
        <FieldArray name="optionals">
            {({ push, remove }) => (
                <>
                    {values?.length > 0 &&
                        values.map((_, index) => (
                            <Row gutter={[20, 20]} key={index} justify="start" align="middle">
                                <Col xs={10}>
                                    <Flex className="flex-col">
                                        <TextInput
                                            name={`optionals[${index}].key`}
                                            label="Option key"
                                            type="text"
                                            placeholder="Please enter option key "
                                            isRequired
                                            // allowNumbersOnly
                                        />
                                        <ErrorMessage
                                            name={`optionals[${index}].key`}
                                            render={msg => (
                                                <div className="-mt-6 text-red-500 error-message">
                                                    {msg}
                                                </div>
                                            )}
                                        />
                                    </Flex>
                                </Col>
                                <Col xs={10}>
                                    <Flex className="flex-col">
                                        <TextInput
                                            name={`optionals[${index}].value`}
                                            label="Option Value"
                                            type="text"
                                            placeholder="Please enter option value "
                                            isRequired
                                        />
                                        <ErrorMessage
                                            name={`optionals[${index}].value`}
                                            render={msg => (
                                                <div className="-mt-6 text-red-500 error-message">
                                                    {msg}
                                                </div>
                                            )}
                                        />
                                    </Flex>
                                </Col>
                                {index >= 0 && (
                                    <Col xs={4}>
                                        <DeleteOutlined
                                            onClick={() => remove(index)}
                                            className="pl-3 text-xl text-bgOrange2"
                                        />
                                    </Col>
                                )}
                            </Row>
                        ))}
                </>
            )}
        </FieldArray>
        <FieldArray name="optionals">
            {({ push }) => (
                <Button
                    className="mb-5"
                    danger
                    onClick={() =>
                        push({
                            key: '',
                            value: '',
                        })
                    }
                >
                    Add Options
                </Button>
            )}
        </FieldArray>
    </Flex>
);

export default OptionalForm;
