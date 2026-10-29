/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback } from 'react';

import {
    Button,
    Card,
    Col,
    Divider,
    Flex,
    Image,
    Input,
    InputNumber,
    Row,
    Table,
    Typography,
} from 'antd';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CheckoutMobile from './CheckoutMobile';
import CheckoutTextRow from '../../GiftCards/components/CheckoutTextRow';
import useCheckout from '../hooks/useCheckout';
import { updateQuantity } from '../slices/hikeSlice';

const { Text, Title } = Typography;

const Checkout = () => {
    const dispatch = useDispatch();
    const { md } = useScreenSize();

    const { handleSubmission } = useCheckout();
    const { hikeArray } = useAppSelector(state => state.reducer.hike);

    const handleQuantityChange = useCallback(
        (id: number, newQuantity: number) => {
            dispatch(updateQuantity({ id, quantity: newQuantity }));
        },
        [dispatch]
    );
    const columns = [
        {
            title: 'Image',
            dataIndex: 'logo',
            key: 'logo',
            width: '15%',
            render: (text: string, record: any) => (
                <Card className="rounded-2xl w-52 h-28">
                    <Flex justify="center" align="center" className="">
                        <Image
                            // width={120}
                            // height={80}
                            src={record.logo}
                            className="object-contain mt-1"
                            preview={false}
                        />
                    </Flex>
                </Card>
            ),
        },

        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: '15%',
            render: (text: string, record: any) => <Text>₹ {record.price}</Text>,
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            width: '15%',
            render: (text: string, record: any) => {
                // Check if the employees array has length > 0
                if (record.employees && record.employees.length > 0) {
                    // If employees are present, display a read-only TextField with the quantity
                    return (
                        <Input
                            value={record.quantity}
                            readOnly
                            className="border rounded-sm w-24"
                        />
                    );
                }
                // Otherwise, display the InputNumber component
                return (
                    <InputNumber
                        min={1}
                        max={10}
                        type="number"
                        className="border rounded-sm"
                        onChange={newQuantity => handleQuantityChange(record.id, newQuantity)}
                        defaultValue={record.quantity}
                        onKeyDown={e => e.preventDefault()}
                    />
                );
            },
        },

        {
            title: 'Total',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            width: '15%',
            render: (text: string, record: any) => (
                <Text data-testid="amounts">
                    ₹ {formatNumberWithLocalString(record.totalPrice)}
                </Text>
            ),
        },
    ];

    const tableContent = hikeArray?.map((item, index) => (
        <CheckoutMobile key={index} item={item} />
    ));
    return (
        <>
            <Text className="text-lg font-medium">Reward your employees</Text>

            <Row className="mt-5" gutter={16}>
                {md ? (
                    <Col xl={17} sm={24}>
                        <Table
                            dataSource={hikeArray}
                            className="border border-b-0 border-t-0"
                            columns={columns}
                            showHeader
                            pagination={false}
                            summary={pageData => {
                                let totalQuantity = 0;
                                let totalPrice = 0;

                                pageData.forEach(({ productQuantity, price }) => {
                                    totalQuantity += productQuantity;
                                    totalPrice += productQuantity * price;
                                });
                                return '';
                            }}
                        />
                    </Col>
                ) : (
                    <Col span={24}>{tableContent}</Col>
                )}

                <Col sm={24} md={24} xl={7} className="w-full xl:mt-0 xs:mt-6">
                    <Flex vertical className=" md:mt-0 mt-5 border border-gray-200 p-6  rounded">
                        <Title level={5}>Total Amount</Title>
                        <Flex vertical className=" mt-4" gap={15}>
                            <CheckoutTextRow
                                text="Subtotal"
                                value={hikeArray?.reduce((acc, item) => acc + item.totalPrice, 0)}
                            />
                            <CheckoutTextRow text="Taxes and fees" value="0.00" />
                            {/* <CheckoutTextRow text="VAT " value="0" /> */}

                            <Divider className="m-0" />

                            <CheckoutTextRow
                                text="Total price"
                                value={hikeArray?.reduce((acc, item) => acc + item.totalPrice, 0)}
                                bold
                            />
                            <div data-testid="continue">
                                <Button
                                    danger
                                    type="primary"
                                    className="w-full font-medium px-5 h-10"
                                    onClick={handleSubmission}
                                >
                                    Continue
                                </Button>
                            </div>
                        </Flex>
                    </Flex>
                </Col>
            </Row>
        </>
    );
};

export default Checkout;
