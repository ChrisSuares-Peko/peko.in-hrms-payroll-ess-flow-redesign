import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';

import { BPOSHistory } from '../types/index';

interface HistoryCardProps {
    item: BPOSHistory;
}
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

const OrderHistorycardMobile: React.FC<HistoryCardProps> = ({ item }) => {
    // Convert string date to Date object
    const [showMore, setshowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const date = dayjs(item.createdAt).format('YYYY-MM-DD');
    const details = [
        { label: 'Date', value: date },
        { label: 'Business Category', value: item.businessCategory || 'N/A' },
        { label: 'City', value: item.city || 'N/A' },
        { label: 'Preferred Language', value: item.preferredLanguage || 'N/A' },
        { label: 'Status', value: item.status || 'N/A' },
    ];

    return (
        <Content className="p-5 rounded-md ">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={7}>
                        {' '}
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{item.storeName}</Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center text-textDarkGray">
                                {item.contactPerson}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={8}>
                        <Flex justify="center">
                            <Button
                                danger
                                size="small"
                                className="px-3 text-xs border-0 rounded-xl"
                                disabled
                            >
                                {item.mobileNumber}
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
