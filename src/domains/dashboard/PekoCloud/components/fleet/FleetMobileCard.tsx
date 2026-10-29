import React, { useState } from 'react';

import { RightOutlined, DeleteOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { formatDate } from '../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        vehicleName: string;
        vehicleType: string;
        usedBy: string;
        vehicleNumber: string;
        purchasedDate: string;
        assetType: number;
        dateOfRenewal: string;
        status: string;
        actions: string;
        amount: string;
        id: string;
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

const FleetMobilecard: React.FC<HistoryCardProps> = ({ item, handleDelete, handleEdit }) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        { label: 'Vehicle Type', value: item?.vehicleType },
        { label: 'Assigned to', value: item?.usedBy },
        { label: 'Vehicle Number', value: item?.vehicleNumber },
        {
            label: 'Purchased Date',
            value: formatDate(item?.purchasedDate),
        },
        { label: 'Asset Type', value: item?.assetType },
        {
            label: 'Registration Renewal Date',
            value: formatDate(item?.dateOfRenewal),
        },
        {
            label: 'Amount',
            value: `₹ ${formatNumberWithLocalString(item?.amount)}`,
        },
    ];

    let colorClass = '';
    if (item?.status === 'Active' || item?.status === 'Reserved') {
        colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    } else {
        colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
    }

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex gap={10} className="-ml-[.125rem]">
                            <Link
                                style={{ color: '#101828', textDecoration: 'none' }}
                                to={`/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}/${paths.pekoCloud.fleetDetails}`}
                                state={{
                                    fleetId: item?.id,
                                    data: item,
                                }}
                            >
                                <Flex vertical justify="center">
                                    <Typography.Text className="text-xs font-medium">
                                        {item?.vehicleName}
                                    </Typography.Text>
                                </Flex>
                            </Link>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text
                                className={`text-xs font-normal px-3 py-1 rounded-2xl whitespace-nowrap text-center ${colorClass}`}
                            >
                                {item?.status}
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
                            </Space>
                        </Flex>
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default FleetMobilecard;
