import React, { memo, useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useDownloadInvoice } from '../hooks/useDownloadInvoice';
import { subscriptionTransactionRow } from '../types/index';

interface DetailProps {
    label: string;
    value: string | number;
}

const { Text } = Typography;
const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full ">
        <Text style={{ fontWeight: 400 }}>{label} :</Text>
        <Text className="font-normal">{value}</Text>
    </Flex>
);

interface TableProp {
    transaction: subscriptionTransactionRow;
    isCashbackTable: boolean;
}
const SubscriptionTableMobile: React.FC<TableProp> = ({ transaction, isCashbackTable }) => {
    const { amount, date, status, transactionID, serviceName, billingType, isInvoice } =
        transaction;
    const { getInvoiceData, loadingTxnId, loadingType } = useDownloadInvoice();
    const [showMore, setshowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const handleDownloadInvoiceOrReceipt = (txnId: number, type: 'invoice' | 'receipt') => {
        getInvoiceData(txnId, type);
    };
    const details = React.useMemo(
        () => [
            { label: 'Date', value: formattedDateTime(new Date(date)) },
            { label: 'Order ID', value: transactionID },
            { label: 'Billing Type', value: billingType },
            { label: 'Payment Mode', value: transaction.paymentMode },
        ],
        [date, transactionID, transaction.paymentMode, billingType]
    );

    return (
        <Content className="p-3 rounded-md sm:p-5 ">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={7}>
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{serviceName}</Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Text className="text-xs font-normal text-center text-textDarkGray">
                                ₹ {formatNumberWithLocalString(Number(amount))}
                            </Text>
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
                                    <Text className="text-xs">
                                        {status === 'Pending' ? 'In Progress' : status}
                                    </Text>
                                </Button>
                            ) : (
                                <Flex justify="center">
                                    <Text className="text-xs font-normal text-center text-textDarkGray">
                                        ₹{' '}
                                        {formatNumberWithLocalString(Number(transaction.cashback))}
                                    </Text>
                                </Flex>
                            )}
                        </Flex>
                    </Col>
                    <Col xs={3}>
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

export default memo(SubscriptionTableMobile);
