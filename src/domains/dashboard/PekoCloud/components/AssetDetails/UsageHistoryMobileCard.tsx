import React, { useState } from 'react';

import { RightOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formatDate } from '../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        employee: string;
        returnStatus: string;
        assignDate: string;
        returnDate: string;
        remarks: string;
        status: string;
        actions: string;
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

const UsageHistoryMobileCard: React.FC<HistoryCardProps> = ({ item, handleDelete, handleEdit }) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        { label: 'Assigned Date', value: item?.assignDate ? formatDate(item?.assignDate) : 'N/A' },
        { label: 'Returned Date', value: item?.returnDate ? formatDate(item?.returnDate) : 'N/A' },
        { label: 'Return Status', value: item?.returnStatus ? item?.returnStatus : 'N/A' },
        { label: 'Remarks', value: item?.remarks ? item?.remarks : 'N/A' },
    ];

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex vertical justify="center">
                            <Typography.Text className="text-xs font-medium">
                                {item?.employee}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center">
                                {item?.returnStatus || 'N/A'}
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

export default UsageHistoryMobileCard;
