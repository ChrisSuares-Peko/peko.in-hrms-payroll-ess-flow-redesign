import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import formatString from '@utils/wordFormat';

const { Text } = Typography;

interface HistoryCardProps {
    item: {
        Operator: string;
        status: string;
        corporateTxnId: string;
        createdAt: string;
        bbpsSupportHistory: { requestBody: { txnRefId: string } };
        category: string;
        amount: string;
    };
}
interface DetailProps {
    label: string;
    value: string | number;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full ">
        <Text style={{ fontWeight: 400 }}>{label} :</Text>
        <Text className="font-normal">{value}</Text>
    </Flex>
);

const OrderHistorycardMobile: React.FC<HistoryCardProps> = ({ item }) => {
    // Convert string date to Date object
    const [showMore, setshowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const date = formattedDateTime(new Date(item.createdAt));
    const details = [
        { label: 'Order ID', value: item.corporateTxnId },
        { label: 'Date', value: date },
        {
            label: 'B-Connect Transaction ID',
            value: item?.bbpsSupportHistory?.requestBody?.txnRefId,
        },
        { label: 'Bill Category', value: item.category },
    ];

    return (
        <Content className="p-5 rounded-md ">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={7}>
                        {' '}
                        <Flex justify="start">
                            <Text className="text-xs">{item.Operator}</Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Text
                                data-testid="amount"
                                className="text-xs font-normal text-center text-textDarkGray"
                            >
                                ₹ {formatNumberWithLocalString(item.amount)}
                            </Text>
                        </Flex>
                    </Col>
                    <Col xs={8}>
                        <Flex justify="center">
                            <Button
                                danger
                                size="small"
                                style={{
                                    background:
                                        item.status === 'SUCCESS' || item.status === 'REFUNDED'
                                            ? 'var(--Success-50, #ECFDF3)'
                                            : '#ffc2c2',

                                    color:
                                        item.status === 'SUCCESS' || item.status === 'REFUNDED'
                                            ? 'var(--Success-700, #027A48)'
                                            : '#d97b7b',
                                }}
                                className="px-3 text-xs border-0 rounded-xl"
                                disabled
                            >
                                {formatString(item.status)}
                            </Button>
                        </Flex>
                    </Col>
                    <Col xs={2}>
                        <Flex justify="end">
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
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default OrderHistorycardMobile;
