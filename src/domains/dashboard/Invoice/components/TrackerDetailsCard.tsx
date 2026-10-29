/* eslint-disable no-nested-ternary */
import React from 'react';

import { Card, Flex, Typography, Table, Divider, Image, Row, Col, ConfigProvider } from 'antd';

import { columns } from '../utils/data';

const { Text, Paragraph } = Typography;

const TrackerDetailsCard = ({
    data,
    // componentRef,
    dataSource,
}: {
    data: any;
    // componentRef: any;
    dataSource: any[];
}) => {
    const themeConfig = {
        components: {
            Table: {
                headerBg: '#454444',
                headerColor: '#FFFFFF',
            },
        },
    };
    const comments = data?.comments?.replace(/"/g, '');
    return (
        <Flex vertical gap={5} className="w-full ">
            <Card
                // ref={componentRef}
                className="mt-6 border border-gray-300 rounded-md "
            >
                <Row gutter={[20, 20]} className="w-full" align="top">
                    <Col span={24} className="w-full">
                        <Flex
                            justify={`${data?.invoiceDetails.logo ? 'space-between' : 'end'}`}
                            align="center"
                            className="w-full"
                        >
                            {data?.invoiceDetails.logo && (
                                <Image
                                    src={data?.invoiceDetails && data?.invoiceDetails.logo}
                                    preview={false}
                                    loading="lazy"
                                    height={80}
                                    width={80}
                                />
                            )}
                            <Text className="font-medium xs:text-lg md:text-3xl">
                                {data?.invoiceDetails.invoiceName}
                            </Text>
                        </Flex>
                    </Col>

                    <Col span={14} className="flex self-start justify-between gap-4 mt-5 align-top">
                        <Flex vertical gap={5}>
                            <Text className="font-bold xs:text-xs md:text-sm ">Billed To</Text>
                            {data && (
                                <Text className="font-medium xs:text-xs md:text-sm">
                                    {data.recipientDetails && data.recipientDetails?.customerName}
                                </Text>
                            )}
                            {data && (
                                <Text className="xs:text-xs md:text-sm">
                                    {data.recipientDetails &&
                                        data.recipientDetails?.customerAddress}
                                </Text>
                            )}
                            {data.recipientDetails?.customerPhone && (
                                <Text className="xs:text-xs md:text-sm">
                                    {data.recipientDetails && data.recipientDetails?.customerPhone}
                                </Text>
                            )}
                            {data.recipientDetails?.customerEmail && (
                                <Text className="font-medium xs:text-xs md:text-sm">
                                    {data.recipientDetails && data.recipientDetails?.customerEmail}
                                </Text>
                            )}
                        </Flex>
                    </Col>
                    <Col span={10} className="xs:mt-4 md:mt-10">
                        <Flex vertical gap={10}>
                            <Flex gap={10} justify="space-between">
                                <Text className="font-normal">Invoice No</Text>
                                {data && (
                                    <Text className="font-medium xs:text-xs md:text-sm">
                                        #{data?.invoiceDetails.invoiceNo}
                                    </Text>
                                )}
                            </Flex>

                            <Flex vertical gap={10}>
                                <Flex gap={10} justify="space-between">
                                    <Text className="font-normal">Invoice Date</Text>
                                    {data && (
                                        <Text className="font-medium xs:text-xs md:text-sm">
                                            {data.invoiceDetails && data.invoiceDetails.invoiceDate}
                                        </Text>
                                    )}
                                </Flex>
                                {data?.invoiceDetails.dueDate && (
                                    <Flex gap={10} justify="space-between">
                                        <Text className="font-normal">Due Date</Text>
                                        {data && (
                                            <Text className="font-medium xs:text-xs md:text-sm">
                                                {data?.invoiceDetails?.dueDate}
                                            </Text>
                                        )}
                                    </Flex>
                                )}
                            </Flex>
                        </Flex>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <ConfigProvider theme={themeConfig}>
                            <Table
                                className="mt-5 "
                                dataSource={dataSource}
                                columns={columns}
                                pagination={false}
                                scroll={{ x: 500 }}
                            />
                        </ConfigProvider>
                    </Col>
                    <Col span={24} className="flex justify-end mt-8">
                        <Flex className="justify-end w-2/3">
                            <Flex vertical className="overflow-scroll w-fit">
                                <Flex vertical gap={10} className="w-full">
                                    <Flex className="md:px-2">
                                        <Flex>
                                            <Text className="font-medium w-36 text-nowrap">
                                                Sub Total
                                            </Text>
                                        </Flex>

                                        <Flex>
                                            <Text className="font-semibold xs:text-xs md:text-sm text-nowrap">
                                                ₹ {data?.paymentDetails?.subTotal ?? 0}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Divider className="p-0 m-0" />
                                    <Flex className="md:px-2">
                                        <Flex>
                                            <Text className="font-medium w-36 text-nowrap">
                                                Gst
                                            </Text>
                                        </Flex>

                                        <Flex className="flex-1">
                                            <Text className="w-32 font-semibold xs:text-xs md:text-sm text-nowrap">
                                                ₹{' '}
                                                {data?.paymentDetails?.gst
                                                    ? data?.paymentDetails?.gst
                                                    : 0}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Divider className="p-0 m-0" />
                                    <Flex justify="space-between" className="md:px-2">
                                        <Flex>
                                            <Text className="font-medium w-36 text-nowrap">
                                                Discount
                                            </Text>
                                        </Flex>

                                        <Flex className="flex-1">
                                            <Flex>
                                                <Text className="w-32 font-semibold xs:text-xs md:text-sm text-nowrap">
                                                    ₹{' '}
                                                    {data?.paymentDetails?.discount
                                                        ? data?.paymentDetails?.discount
                                                        : 0}
                                                </Text>
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                    <Divider className="p-0 m-0" />
                                    <Flex justify="space-between" className="md:px-2">
                                        <Flex>
                                            <Text className="font-medium w-36 text-nowrap">
                                                Shipping
                                            </Text>
                                        </Flex>

                                        <Flex className="flex-1">
                                            <Text className="w-32 font-semibold xs:text-xs md:text-sm text-nowrap">
                                                ₹{' '}
                                                {parseFloat(data?.paymentDetails?.shipping)
                                                    ? parseFloat(
                                                          data.paymentDetails.shipping
                                                      ).toFixed(2)
                                                    : '0.00'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Divider className="p-0 m-0" />
                                    <Flex justify="space-between" className="md:px-2">
                                        <Flex>
                                            <Text className="font-medium w-36 text-nowrap">
                                                Total
                                            </Text>
                                        </Flex>

                                        <Flex className="flex-1">
                                            <Text className="w-32 font-semibold xs:text-xs md:text-sm text-nowrap">
                                                ₹ {data?.paymentDetails?.total ?? 0}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Divider className="p-0 m-0" />
                                    <Flex justify="space-between" className="md:px-2">
                                        <Flex>
                                            <Text className="font-medium w-36 text-nowrap">
                                                Amount Paid
                                            </Text>
                                        </Flex>

                                        <Flex className="flex-1">
                                            <Text className="w-32 font-semibold xs:text-xs md:text-sm text-nowrap">
                                                ₹{' '}
                                                {data?.status === 'PAID'
                                                    ? parseFloat(data?.paymentDetails?.total)
                                                        ? parseFloat(
                                                              data?.paymentDetails?.total
                                                          ).toFixed(2)
                                                        : '0.00'
                                                    : parseFloat(data?.paymentDetails?.amountPaid)
                                                      ? parseFloat(
                                                            data?.paymentDetails?.amountPaid
                                                        ).toFixed(2)
                                                      : '0.00'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        justify="space-between "
                                        className="py-2 bg-greyBlack md:px-2"
                                    >
                                        <Flex>
                                            <Text className="font-medium text-navTextColor w-36 text-nowrap">
                                                Amount Due
                                            </Text>
                                        </Flex>

                                        <Flex className="flex-1">
                                            <Text className="w-32 font-semibold xs:text-xs md:text-sm text-navTextColor text-nowrap">
                                                ₹{' '}
                                                {data?.status === 'PAID'
                                                    ? '0.00'
                                                    : parseFloat(data?.paymentDetails?.amountDue)
                                                      ? parseFloat(
                                                            data?.paymentDetails?.amountDue
                                                        ).toFixed(2)
                                                      : '0.00'}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Flex>
                    </Col>
                </Row>
                <Flex vertical gap={10} className="mt-4 md:mt-2">
                    {data?.termsConditions && (
                        <Flex vertical>
                            <Text className="font-bold xs:text-xs md:text-sm">
                                Terms & Conditions
                            </Text>
                            <Paragraph className="mt-2">{data?.termsConditions}</Paragraph>
                        </Flex>
                    )}
                    {JSON.parse(data?.comments) && (
                        <Flex vertical>
                            <Text className="font-bold xs:text-xs md:text-sm">Notes</Text>
                            <Paragraph className="mt-2">{comments}</Paragraph>
                        </Flex>
                    )}
                </Flex>
            </Card>
        </Flex>
    );
};

export default React.memo(TrackerDetailsCard);
