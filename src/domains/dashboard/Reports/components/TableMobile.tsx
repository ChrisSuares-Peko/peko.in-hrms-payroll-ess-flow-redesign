import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useDownloadInvoice } from '../hooks/useDownloadInvoice';
import { transactionType } from '../types/index';

interface DetailProps {
    label: string;
    value: string | number;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full ">
        <Typography.Text style={{ fontWeight: 400 }}>{label} :</Typography.Text>
        <Typography.Text className="font-normal">{value}</Typography.Text>
    </Flex>
);

interface TableProp {
    transaction: transactionType;
    isCashbackTable: boolean;
}
const TableMobile: React.FC<TableProp> = ({ transaction, isCashbackTable }) => {
    const { amount, date, status, category, operator, transactionID, isInvoice } = transaction;
    const { getInvoiceData, loadingTxnId, loadingType } = useDownloadInvoice();
    const [showMore, setshowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const handleDownloadInvoiceOrReceipt = (txnId: number, type: 'invoice' | 'receipt') => {
        getInvoiceData(txnId, type);
    };
    const details = [
        { label: 'Date', value: formattedDateTime(new Date(date)) },
        { label: 'Order ID', value: transactionID },
        { label: 'Category', value: category },
        { label: 'Payment Mode', value: transaction.paymentMode },
    ];
    const statusMap: Record<string, string> = {
        Pending: 'In Progress',
        Processing: 'In Progress',
        Failure: 'Failed',
        Success: 'Success',
    };

    const displayTextStatus = statusMap[status] || status;
    return (
        <Content className="p-5 rounded-md ">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={6}>
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{operator}</Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center text-textDarkGray text-nowrap">
                                ₹ {formatNumberWithLocalString(Number(amount))}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            {!isCashbackTable ? (
                                <Button
                                    danger
                                    size="small"
                                    style={{
                                        background:
                                            status === 'Success'
                                                ? 'var(--Success-50, #ECFDF3)'
                                                : 'rgba(242, 244, 247, 1)',

                                        color:
                                            status === 'Success'
                                                ? 'var(--Success-700, #027A48)'
                                                : 'rgba(52, 64, 84, 1)',
                                    }}
                                    className="px-2 border-0 rounded-xl"
                                    disabled
                                >
                                    <Typography.Text className="text-xs">
                                        {displayTextStatus}
                                    </Typography.Text>
                                </Button>
                            ) : (
                                <Flex justify="center">
                                    <Typography.Text className="text-xs font-normal text-center text-textDarkGray">
                                        ₹{' '}
                                        {formatNumberWithLocalString(Number(transaction.cashback))}
                                    </Typography.Text>
                                </Flex>
                            )}
                        </Flex>
                    </Col>
                    <Col xs={4}>
                        <Flex justify="center">
                            <RightOutlined
                                onClick={handleSeeMore}
                                className={`collapse-icon ${showMore ? 'open' : ''}`}
                            />
                        </Flex>
                    </Col>
                </Row>
                {showMore && (
                    <Flex vertical gap={10} className="p-6 bg-bgLightGray">
                        {details.map((detail, index) => (
                            <DetailSection key={index} {...detail} />
                        ))}
                        {status === 'Success' && isInvoice && (
                            <Button
                                danger
                                className="mt-3"
                                loading={
                                    loadingTxnId === transactionID && loadingType === 'invoice'
                                }
                                onClick={() =>
                                    handleDownloadInvoiceOrReceipt(transactionID, 'invoice')
                                }
                            >
                                Download Invoice
                            </Button>
                        )}
                        {status === 'Success' && (
                            <Button
                                danger
                                className="mt-3"
                                loading={
                                    loadingTxnId === transactionID && loadingType === 'receipt'
                                }
                                onClick={() =>
                                    handleDownloadInvoiceOrReceipt(transactionID, 'receipt')
                                }
                            >
                                Download Receipt
                            </Button>
                        )}
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default TableMobile;
