import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import formatString from '@utils/wordFormat';

import { OrderTableItem } from '../../types/orderHistory';

interface DetailProps {
    label: string;
    value: string | number;
}

const { logistics } = paths;

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" gap={5} className="w-full ">
        <Typography.Text className="text-nowrap font-normal">{label}:</Typography.Text>
        <Typography.Text className="font-normal">{value}</Typography.Text>
    </Flex>
);

interface TableProp {
    data: OrderTableItem;
}
const TableMobile: React.FC<TableProp> = ({ data }) => {
    const {
        date,
        status,
        amount,
        paymentStatus,
        trackingNumber: TrackingNumber,
        corporateTxnId: transactionId,
    } = data;
    const navigate = useNavigate();
    const formattedDate = formattedDateTime(new Date(date));
    const [showMore, setshowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const details = [
        { label: 'Date', value: formattedDate },
        { label: 'Amount', value: `₹${formatNumberWithLocalString(parseFloat(amount))}` },
        {
            label: 'Order ID',
            value: transactionId,
        },
        { label: 'Tracking Number', value: TrackingNumber || '-' },
    ];
    return (
        <Content className="p-5 rounded-md ">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={7}>
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{formattedDate}</Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center text-textDarkGray">
                                ₹{formatNumberWithLocalString(parseFloat(amount))}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={8}>
                        <Flex justify="center">
                            <Button
                                danger
                                size="small"
                                style={{
                                    background:
                                        status === 'SUCCESS'
                                            ? 'var(--Success-50, #ECFDF3)'
                                            : 'rgba(242, 244, 247, 1)',
                                    color:
                                        status === 'SUCCESS'
                                            ? 'var(--Success-700, #027A48)'
                                            : 'rgba(52, 64, 84, 1)',
                                }}
                                className="px-3 text-xs border-0 rounded-xl"
                                disabled
                            >
                                {paymentStatus === 'FAILURE'
                                    ? 'Failed'
                                    : formatString(paymentStatus) || 'N/A'}
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
                        <Button
                            size="small"
                            danger
                            className="mt-4"
                            onClick={() =>
                                navigate(
                                    `/${logistics.index}/${logistics.orderHistory}/${logistics.trackOrderDetails}?trackingNo=${data.corporateTxnId}`
                                )
                            }
                        >
                            Track your Order
                        </Button>
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default TableMobile;
