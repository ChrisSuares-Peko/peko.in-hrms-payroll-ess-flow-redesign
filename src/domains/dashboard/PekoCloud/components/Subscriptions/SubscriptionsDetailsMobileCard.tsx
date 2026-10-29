import React, { useState } from 'react';

import { RightOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import softwareDefault from '@domains/dashboard/PekoCloud/assets/icons/subscriptions/software-default.svg';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { formatText } from '../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        subscriptionName: string;
        planDetails: string;
        status: string;
        billingStartDate: string;
        billingCycle: string;
        assignedTo: number;
        numberOfDevices: string;
        actions: string;
        amount: string;
    };
    handleDelete: (record: any) => void;
    handleEdit: (record: any) => void;
    handleEmployeesList: (record: any) => void;
}

interface DetailProps {
    label: string;
    value: string | number;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full">
        <Typography.Text style={{ fontWeight: 400 }} className="whitespace-nowrap">
            {label} :
        </Typography.Text>
        <Typography.Text className="font-normal text-end">{value}</Typography.Text>
    </Flex>
);

const SubscriptionsDetailsMobileCard: React.FC<HistoryCardProps> = ({
    item,
    handleDelete,
    handleEdit,
    handleEmployeesList,
}) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        { label: 'Plan Details', value: item?.planDetails },
        { label: 'Billing Start Date', value: item?.billingStartDate },
        { label: 'Billing Cycle', value: item?.billingCycle },
        {
            label: 'Assigned to',
            value: `${item?.assignedTo} ${item?.assignedTo === 1 ? 'Employee' : 'Employees'}`,
        },
        { label: 'No of Users', value: item?.numberOfDevices },
        {
            label: 'Amount',
            value: `₹ ${formatNumberWithLocalString(item?.amount)}`,
        },
    ];

    let colorClass = '';
    if (item?.status === 'Active' || item?.status === 'Active') {
        colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    } else if (
        item?.status === 'Trial' ||
        item?.status === 'Renewing' ||
        item?.status === 'Upgrade Pending' ||
        item?.status === 'Downgrade Pending' ||
        item?.status === 'Grace Period'
    ) {
        colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
    } else {
        colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
    }
    const formattedStatus = formatText(item?.status);

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex gap={10} className="-ml-[.125rem]">
                            <Flex align="center">
                                <ReactSVG src={softwareDefault} />
                            </Flex>
                            <Flex vertical justify="center">
                                <Typography.Text className="text-xs font-medium">
                                    {item?.subscriptionName}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text
                                className={`${colorClass} px-3 py-1 rounded-2xl whitespace-nowrap text-xs font-normal text-center`}
                            >
                                {formattedStatus}
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
                                <Button
                                    className="border-0"
                                    onClick={() => handleEmployeesList(item)}
                                >
                                    <EyeOutlined className="" />
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

export default SubscriptionsDetailsMobileCard;
