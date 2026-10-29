import React, { lazy } from 'react';

import { Col, Flex, Form, Input, Row, Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const SelectInput = lazy(() => import('@components/atomic/inputs/SelectInput'));

const { Text } = Typography;

const AmountDetails = () => (
    <Row>
        <Col span={8}>
            <Flex vertical className="xs:w-full md:w-[21rem]" justify="space-between" gap={15}>
                <Flex justify="space-between" align="center">
                    <Flex align="center" className="">
                        <Text> Subtotal </Text>
                    </Flex>
                    <Flex>
                        <Input

                        // value={`₹ ${values
                        //     .reduce(
                        //         (acc, item) =>
                        //             acc +
                        //             (parseFloat(item.price) * parseFloat(item.quantity) ||
                        //                 0),
                        //         0
                        //     )
                        //     .toFixed(2)}`}
                        />
                    </Flex>
                </Flex>
                <Flex justify="space-between" align="center">
                    <Text> GST</Text>
                    <Flex>
                        <Input

                        // value={`₹   ${values
                        //     .reduce(
                        //         (acc, item) =>
                        //             acc +
                        //             ((parseFloat(item.gst) *
                        //                 (parseFloat(item.price) *
                        //                     parseFloat(item.quantity) || 0)) /
                        //                 100 || 0),
                        //         0
                        //     )
                        //     .toFixed(2)}`}
                        />
                    </Flex>
                </Flex>
                <Flex justify="space-between" align="center">
                    <Text> Discount</Text>
                    <Flex>
                        <Input

                        // value={`₹ ${values
                        //     .reduce(
                        //         (acc, item) =>
                        //             acc +
                        //             ((parseFloat(item.discount) *
                        //                 (parseFloat(item.price) *
                        //                     parseFloat(item.quantity) || 0)) /
                        //                 100 || 0),
                        //         0
                        //     )
                        //     .toFixed(2)}`}
                        />
                    </Flex>
                </Flex>
            </Flex>
        </Col>
        <Col span={8}>
            <Flex vertical className="xs:w-full md:w-[21rem]" justify="space-between" gap={15}>
                <Flex justify="space-between" align="center">
                    <Text> Shipping</Text>
                    <Flex>
                        <TextInput
                            formItemClass="mb-0"
                            name="shipping"
                            placeholder="Enter Amount"
                            type="text"
                            isRequired
                            allowNumbersOnly
                        />
                    </Flex>
                </Flex>
                {/* <Flex justify="space-between" align="center">
                        <Text> Total</Text>
                        <Flex>
                            <Input
                                disabled
                                value={`₹ ${(
                                    values.reduce(
                                        (acc, item) => acc + (parseFloat(item.amount) || 0),
                                        0
                                    ) + Number(charge || 0)
                                ).toFixed(2)}`}
                            />
                        </Flex>
                    </Flex> */}
                <Flex justify="space-between" align="center">
                    <Flex align="center" className="">
                        <Text> Amount Paid</Text>
                    </Flex>
                    <Flex justify="center" align="center">
                        <TextInput
                            formItemClass="mb-0"
                            name="amountPaid"
                            placeholder="Enter Amount"
                            type="text"
                            isRequired
                            allowNumbersOnly
                        />
                    </Flex>
                </Flex>
                <Flex justify="space-between" align="center">
                    <Text className="font-medium"> Amount Due</Text>
                    <Flex>
                        <Input

                        // value={`₹ ${(
                        //     values.reduce(
                        //         (acc, item) => acc + (parseFloat(item.amount) || 0),
                        //         0
                        //     ) +
                        //     Number(charge || 0) -
                        //     Number(amountPaid || 0)
                        // ).toFixed(2)}`}
                        />
                    </Flex>
                </Flex>
            </Flex>
        </Col>
        <Col span={8}>
            <Form layout="vertical" className="w-full ">
                <SelectInput
                    options={[
                        {
                            value: 'cash',
                            label: 'Cash',
                        },
                        {
                            value: 'bank',
                            label: 'Bank',
                        },
                        {
                            value: 'cheque',
                            label: 'Cheque',
                        },
                        {
                            value: 'others',
                            label: 'Others',
                        },
                    ]}
                    name="paymentMode"
                    label="Payment Method"
                    placeholder="Payment Method"
                />
                <SelectInput
                    options={[
                        {
                            value: 'cash',
                            label: 'Cash',
                        },
                        {
                            value: 'bank',
                            label: 'Bank',
                        },
                        {
                            value: 'cheque',
                            label: 'Cheque',
                        },
                        {
                            value: 'others',
                            label: 'Others',
                        },
                    ]}
                    name="paymentMode"
                    label="Bank Account"
                    placeholder="Bank Account"
                />
            </Form>
        </Col>
    </Row>
);

export default AmountDetails;
