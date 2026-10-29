import React, { useState } from 'react';

import { RightOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { formatDate } from '../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        employee: string;
        department: string;
        joiningDate: string;
        monthlySpent: string;
        actions: string;
        profilePicture: string;
        noOfDevices: any[];
        noOfSubscriptions: any[];
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

const EmployeeDetailsCardMobile: React.FC<HistoryCardProps> = ({
    item,
    handleDelete,
    handleEdit,
}) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        { label: 'Department', value: item?.department },
        { label: 'No of Subscriptions', value: item?.noOfSubscriptions?.length },
        { label: 'No of Devices', value: item?.noOfDevices?.length },
        {
            label: 'Monthly Spend',
            value: `₹ ${formatNumberWithLocalString(item?.monthlySpent)}`,
        },
    ];

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex gap={10} className="-ml-[.125rem]">
                            <Flex vertical justify="center">
                                <Typography.Text className="text-xs font-medium">
                                    {item?.employee}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center">
                                {formatDate(item?.joiningDate)}
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

export default EmployeeDetailsCardMobile;
