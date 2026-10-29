import React from 'react';

import { Card, Col, Divider, Flex, Image, Input, Row, Typography } from 'antd';

const CheckoutMobile = ({ item }: any) =>  (
        <>
            <Card className="rounded-2xl w-full h-28 mt-2">
                <Flex justify="center" align="center" className="">
                    <Image src={item.logo} className="object-contain mt-1" preview={false} />
                </Flex>
            </Card>
            <Row align="middle" className="w-full p-5 mt-3 rounded-md bg-bgLightGray">
                <Col xs={8}>
                    <Flex justify="start">
                        <Typography.Text>Per Price</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={8}>
                    <Flex justify="center">
                        <Typography.Text>Quantity</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={8}>
                    <Flex justify="center">
                        <Typography.Text className="ml-6">Sub Total</Typography.Text>
                    </Flex>
                </Col>
            </Row>
            <Flex gap={20} vertical>
                <Row align="middle" className="mt-3">
                    <Col xs={8}>
                        {' '}
                        <Flex justify="">
                            <Typography.Text className="px-5 text-xs">
                                {/* {formattedDateTime(new Date(item.createdAt))} */}₹ {item.price}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={8}>
                        <Flex justify="center">
                            {item.employees && item.employees.length > 0 ? (
                                <Input
                                    value={item.quantity}
                                    readOnly
                                    className="border rounded-sm w-24"
                                />
                            ) : (
                                // <InputNumber
                                //   min={1}
                                //   max={10}
                                //   type="number"
                                //   className="border rounded-sm"
                                //   onChange={newQuantity => handleQuantityChange(item.id, newQuantity)}
                                //   defaultValue={item.quantity}
                                //   onKeyDown={e => e.preventDefault()}
                                // />
                                <Input
                                    value={item.quantity}
                                    readOnly
                                    className="border rounded-sm w-24"
                                />
                            )}
                        </Flex>
                    </Col>

                    <Col xs={8}>
                        {' '}
                        <Flex justify="center">
                            <Typography.Text className="text-xs">
                                ₹ {item.totalPrice}
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>

                <Divider className="border border-solid" />
            </Flex>
        </>
    );

export default CheckoutMobile;
