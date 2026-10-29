import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Input, Row, Typography } from 'antd';
import { ErrorMessage, Field, FieldArray } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import AdditionalDetailsFormCreate from './AdditionalDetailsFormCreate';
import CustomTextAreaWithLabel from './CustomTextAreaWithLabel';
import WishListFormCreate from './WishListFormCreate';
import WishListHeadingCreate from './WishListHeadingCreate';
import { ProductDetail } from '../../types/index';
import CustomDropDown from '../CustomDropDown';

type WishListProps = {
    values: ProductDetail[];
    charge: string;
    amountPaid: string;
    setFieldValue: (field: string, value: any) => void;
};
const { Text } = Typography;

const WishListCreate: React.FC<WishListProps> = ({ values, charge, amountPaid, setFieldValue }) => {
    const {
        collectorKyb: { kybStatus },
    } = useAppSelector(state => state.reducer.invoices);

    return (
        <Flex vertical className="w-full" gap={20}>
            <Flex justify="space-between" align="center" className="w-full">
                <Text className="font-semibold">Items</Text>
                <FieldArray name="items">
                    {({ push }) =>
                        values.length < 10 && (
                            <Button
                                className="rounded-xl"
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
                                Add Item
                            </Button>
                        )
                    }
                </FieldArray>
            </Flex>
            <Card
                size="small"
                className="w-full border-0 border-b"
                styles={{ body: { padding: 0 } }}
            >
                <WishListHeadingCreate />
                <FieldArray name="items">
                    {({ push, remove }) => (
                        <>
                            {values.map((_, index) => (
                                <Flex
                                    key={index}
                                    justify="space-between"
                                    align="center"
                                    className={`px-3 ${index !== values.length - 1 && 'mb-6 '} xl:mb-3 flex-col xl:flex-row gap-4 xl:gap-0`}
                                >
                                    <WishListFormCreate index={index} />
                                    <Flex justify="right" className="w-full xl:w-fit h-10 xl:mt-0">
                                        {values.length === 1 ? (
                                            <DeleteOutlined
                                                data-testid={`delete-item-${index}`}
                                                className="text-xl mb-3 xl:mb-0 text-gray-400 pl-3 cursor-not-allowed"
                                            />
                                        ) : (
                                            <DeleteOutlined
                                                data-testid={`delete-item-${index}`}
                                                onClick={() => remove(index)}
                                                className="text-xl mb-3 xl:mb-0 text-bgOrange2 pl-3"
                                            />
                                        )}
                                    </Flex>
                                </Flex>
                            ))}
                        </>
                    )}
                </FieldArray>
            </Card>
            <Row className="flex justify-between xs:flex-col md:flex-row">
                <Col sm={24} xl={8}>
                    <AdditionalDetailsFormCreate />
                </Col>
                <Col sm={24} xl={8}>
                    <Flex vertical className="w-full" gap={15}>
                        <CustomTextAreaWithLabel
                            label="Sub Total"
                            defaultValue={`₹ ${values
                                .reduce(
                                    (acc, item) =>
                                        acc +
                                        (parseFloat(item.price) * parseFloat(item.quantity) || 0),
                                    0
                                )
                                .toFixed(2)}`}
                        />

                        <CustomTextAreaWithLabel
                            label="GST"
                            defaultValue={`₹   ${values
                                .reduce(
                                    (acc, item) =>
                                        acc +
                                        ((parseFloat(item.gst) *
                                            (parseFloat(item.price) * parseFloat(item.quantity) ||
                                                0)) /
                                            100 || 0),
                                    0
                                )
                                .toFixed(2)}`}
                        />

                        <CustomTextAreaWithLabel
                            label="Discount"
                            defaultValue={`₹ ${values
                                .reduce(
                                    (acc, item) =>
                                        acc +
                                        ((parseFloat(item.discount) *
                                            (parseFloat(item.price) * parseFloat(item.quantity) ||
                                                0)) /
                                            100 || 0),
                                    0
                                )
                                .toFixed(2)}`}
                        />

                        <Flex justify="space-between" align="center">
                            <Form.Item className="w-full p-0 m-0">
                                <Flex className="justify-between w-full px-3 py-2 border border-gray-200 borderjust rounded-xl">
                                    <Text className="text-gray-500 text-nowrap"> Shipping</Text>
                                    <Field
                                        as={Input}
                                        name="shipping"
                                        placeholder="Enter Amount"
                                        type="text"
                                        className="p-0 text-black text-end"
                                        variant="borderless"
                                        onChange={(e: { target: { value: any } }) => {
                                            const { value } = e.target;
                                            let filteredValue = value;
                                            filteredValue = value
                                                .replace(/[^\d.]/g, '')
                                                .replace(/(\..*?)\..*/g, '$1')
                                                .replace(/(\.\d{2})\d+/, '$1');
                                            setFieldValue('shipping', filteredValue);
                                        }}
                                        maxLength={10}
                                    />
                                </Flex>
                                <ErrorMessage
                                    name="shipping"
                                    component="div"
                                    className="w-full text-red-500 error-message"
                                />
                            </Form.Item>
                        </Flex>

                        <CustomTextAreaWithLabel
                            label="Total"
                            defaultValue={`₹ ${(
                                values.reduce(
                                    (acc, item) => acc + (parseFloat(item.amount) || 0),
                                    0
                                ) + Number(charge || 0)
                            ).toFixed(2)}`}
                        />

                        <Flex justify="space-between" align="center">
                            <Form.Item className="w-full p-0 m-0">
                                <Flex className="justify-between w-full px-3 py-2 border border-gray-200 borderjust rounded-xl">
                                    <Text className="text-gray-500 text-nowrap">Amount Paid</Text>
                                    <Field
                                        as={Input}
                                        name="amountPaid"
                                        placeholder="Enter Amount"
                                        type="text"
                                        maxLength={10}
                                        className="p-0 text-black text-end"
                                        variant="borderless"
                                        onChange={(e: { target: { value: any } }) => {
                                            const { value } = e.target;
                                            let filteredValue = value;
                                            filteredValue = value
                                                .replace(/[^\d.]/g, '')
                                                .replace(/(\..*?)\..*/g, '$1')
                                                .replace(/(\.\d{2})\d+/, '$1');
                                            setFieldValue('amountPaid', filteredValue);
                                        }}
                                    />
                                </Flex>
                                <ErrorMessage
                                    name="amountPaid"
                                    component="div"
                                    className="w-full text-red-500 error-message"
                                />
                            </Form.Item>
                        </Flex>

                        <CustomTextAreaWithLabel
                            label="Amount Due"
                            defaultValue={`₹ ${(
                                values.reduce(
                                    (acc, item) => acc + (parseFloat(item.amount) || 0),
                                    0
                                ) +
                                Number(charge || 0) -
                                Number(amountPaid || 0)
                            ).toFixed(2)}`}
                        />

                        <Field name="paymentMode">
                            {() => (
                                <CustomDropDown
                                    showLabelAfterSelect
                                    name="paymentMode"
                                    handleChange={e => {
                                        setFieldValue('paymentMode', e?.value || '');
                                    }}
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
                                        kybStatus === 'APPROVED' && {
                                            value: 'payment link',
                                            label: 'Payment Link',
                                        },
                                        {
                                            value: 'others',
                                            label: 'Others',
                                        },
                                    ].filter(Boolean)}
                                    label="Payment Mode"
                                />
                            )}
                        </Field>
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default WishListCreate;
