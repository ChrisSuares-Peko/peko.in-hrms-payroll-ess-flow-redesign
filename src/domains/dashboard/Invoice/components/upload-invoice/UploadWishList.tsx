import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Input, Row, Typography } from 'antd';
import { ErrorMessage, Field, FieldArray } from 'formik';

import PaymentDetailsForm from '../../forms/PaymentDetailsForm';
import WishListForm from '../../forms/WishListForm';
import { ProductDetail } from '../../types/index';

type WishListProps = {
    values: ProductDetail[];
    charge: string;
    amountPaid: string;
    setFieldValue: (field: string, value: any) => void;
};
const { Text } = Typography;

const UploadWishList = ({ values, charge, amountPaid, setFieldValue }: WishListProps) => (
    <Flex vertical className="w-full" gap={20}>
        <Flex justify="space-between" align="center" className="w-full">
            <Text className="font-medium xs:text-sm md:text-lg">
                Enter the items you wish to bill:
            </Text>
            <FieldArray name="items">
                {({ push }) =>
                    values.length < 10 && (
                        <Button
                            danger
                            onClick={() =>
                                push({
                                    item: '',
                                    quantity: '',
                                    price: '',
                                    gst: '',
                                    discount: '',
                                    amount: '',
                                    // subTotal: '',
                                })
                            }
                        >
                            Add New Item
                        </Button>
                    )
                }
            </FieldArray>
        </Flex>
        <Card size="small" className="w-full">
            <FieldArray name="items">
                {({ push, remove }) => (
                    <>
                        {values.map((_, index) => (
                            <Flex key={index} justify="space-between" align="center">
                                <WishListForm index={index} />
                                <DeleteOutlined
                                    data-testid={`delete-item-${index}`}
                                    onClick={() => remove(index)}
                                    className={`text-xl text-bgOrange2 pl-3 ${index === 0 ? 'invisible' : ''}`}
                                />
                            </Flex>
                        ))}
                    </>
                )}
            </FieldArray>
        </Card>
        <Row gutter={40}>
            <Col xs={12} sm={8}>
                <Flex className="items-end w-full h-full">
                    <PaymentDetailsForm />
                </Flex>
            </Col>
            <Col xs={24} xl={16} className="mb-6">
                <Row gutter={[40, 20]} className="w-full">
                    <Col xs={24} md={12} xl={12} className="flex items-center justify-between">
                        <Flex align="center" className="">
                            <Text> Subtotal</Text>
                        </Flex>
                        <Flex>
                            <Input
                                disabled
                                value={`₹ ${values
                                    .reduce(
                                        (acc, item) =>
                                            acc +
                                            (parseFloat(item.price) * parseFloat(item.quantity) ||
                                                0),
                                        0
                                    )
                                    .toFixed(2)}`}
                            />
                        </Flex>
                    </Col>

                    <Col xs={24} md={12} xl={12} className="flex items-center justify-between">
                        <Text> Shipping</Text>
                        <Flex justify="center" align="center">
                            <Form.Item className="mb-0">
                                <Field
                                    as={Input}
                                    name="shipping"
                                    placeholder="Enter Amount"
                                    type="text"
                                    className="mb-0"
                                    onChange={(e: { target: { value: any } }) => {
                                        const { value } = e.target;
                                        let filteredValue = value;
                                        filteredValue = value
                                            .replace(/[^0-9.]/g, '')
                                            .replace(/(\..*?)\..*/g, '$1');
                                        setFieldValue('shipping', filteredValue);
                                    }}
                                    maxLength={10}
                                />
                                <ErrorMessage
                                    name="shipping"
                                    component="div"
                                    className="text-red-500 error-message w-44"
                                />
                            </Form.Item>
                        </Flex>
                    </Col>

                    <Col xs={24} md={12} xl={12} className="flex items-center justify-between">
                        <Text> GST</Text>
                        <Flex>
                            <Input
                                disabled
                                value={`₹   ${values
                                    .reduce(
                                        (acc, item) =>
                                            acc +
                                            ((parseFloat(item.gst) *
                                                (parseFloat(item.price) *
                                                    parseFloat(item.quantity) || 0)) /
                                                100 || 0),
                                        0
                                    )
                                    .toFixed(2)}`}
                            />
                        </Flex>
                    </Col>

                    <Col xs={24} md={12} xl={12} className="flex items-center justify-between">
                        <Text>Amount Paid</Text>
                        <Flex>
                            <Form.Item className="mb-0">
                                <Field
                                    as={Input}
                                    name="amountPaid"
                                    placeholder="Enter Amount"
                                    type="text"
                                    maxLength={10}
                                    className="mb-0"
                                    onChange={(e: { target: { value: any } }) => {
                                        const { value } = e.target;
                                        let filteredValue = value;
                                        filteredValue = value
                                            .replace(/[^0-9.]/g, '')
                                            .replace(/(\..*?)\..*/g, '$1');
                                        setFieldValue('amountPaid', filteredValue);
                                    }}
                                />
                                <ErrorMessage
                                    name="amountPaid"
                                    component="div"
                                    className="text-red-500 error-message w-44"
                                />
                            </Form.Item>
                        </Flex>
                    </Col>

                    <Col xs={24} md={12} xl={12} className="flex items-center justify-between">
                        <Text> Discount</Text>
                        <Flex>
                            <Input
                                disabled
                                value={`₹ ${values
                                    .reduce(
                                        (acc, item) =>
                                            acc +
                                            ((parseFloat(item.discount) *
                                                (parseFloat(item.price) *
                                                    parseFloat(item.quantity) || 0)) /
                                                100 || 0),
                                        0
                                    )
                                    .toFixed(2)}`}
                            />
                        </Flex>
                    </Col>

                    <Col xs={24} md={12} xl={12} className="flex items-center justify-between">
                        <Text className="font-medium">Total Amount Due</Text>
                        <Flex>
                            <Input
                                data-testid="amount-due-field"
                                disabled
                                value={`₹ ${(
                                    values.reduce(
                                        (acc, item) => acc + (parseFloat(item.amount) || 0),
                                        0
                                    ) +
                                    Number(charge || 0) -
                                    Number(amountPaid || 0)
                                ).toFixed(2)}`}
                            />
                        </Flex>
                    </Col>
                </Row>
            </Col>
        </Row>
    </Flex>
);

export default React.memo(UploadWishList);
