import React, { useState } from 'react';

import { RightOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { formatDate } from '../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        dateAndTime: string;
        repairCategory: string;
        serviceType: string;
        dateReceived: string;
        status: string;
        actions: string;
        amount: string;
    };
    handleDelete: (record: any) => void;
    handleEdit: (record: any) => void;
}

interface DetailProps {
    label: string;
    value: string | number;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full">
        <Typography.Text style={{ fontWeight: 400 }}>{label} :</Typography.Text>
        <Typography.Text className="font-normal">{value}</Typography.Text>
    </Flex>
);

const MaintenanceMobileCard: React.FC<HistoryCardProps> = ({ item, handleDelete, handleEdit }) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        { label: 'Service Type', value: item?.serviceType },
        { label: 'Date Received', value: formatDate(item?.dateReceived) },
        {
            label: 'Amount',
            value: `₹ ${formatNumberWithLocalString(item?.amount)}`,
        },
    ];

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex vertical justify="center">
                            <Typography.Text className="text-xs font-medium">
                                {formatDate(item?.dateAndTime)}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center">
                                {item?.repairCategory}
                            </Typography.Text>
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
                        <Flex justify="center">
                            <Space size="middle">
                                <Button className="border-0" onClick={() => handleDelete(item)}>
                                    <DeleteOutlined className="text-[#E30000]" />
                                </Button>
                                <Button className="border-0" onClick={() => handleEdit(item)}>
                                    <EditOutlined className="text-[#E30000]" />
                                </Button>
                            </Space>
                        </Flex>
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default MaintenanceMobileCard;
