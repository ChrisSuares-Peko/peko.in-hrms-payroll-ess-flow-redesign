import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Col, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { formatDate } from '../../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        chequeBookNumber: string;
        type: string;
        payeeName: string;
        bankAccount: string;
        chequeNumber: string;
        dateOfCheque: string;
        dueDate: string;
        status: string;
        actions: string;
        amount: string;
        document: string;
        documentAvailability: string;
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

const ChequeLeafMobileCard: React.FC<HistoryCardProps> = ({ item, handleDelete, handleEdit }) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        // { label: 'Type', value: item?.type },
        { label: 'Payee Name', value: item?.payeeName },
        { label: 'Bank Account No', value: item?.bankAccount },
        { label: 'Cheque Number', value: item?.chequeNumber },
        { label: 'Cheque Date', value: formatDate(item?.dateOfCheque) },
        { label: 'Due Date', value: formatDate(item?.dueDate) },
        {
            label: 'Amount',
            value: `₹ ${formatNumberWithLocalString(item?.amount)}`,
        },
    ];
    let colorClass = '';
    if (item?.status === 'Cleared') {
        colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    } else if (item?.status === 'Issued' || item?.status === 'Presented') {
        colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
    } else {
        colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
    }
    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex gap={10} className="-ml-[.125rem]">
                            <Flex vertical justify="center">
                                <Typography.Text className="text-xs font-medium">
                                    {item?.chequeBookNumber}
                                </Typography.Text>
                            </Flex>
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
                        {/* <Flex justify="center">
                            <Space size="middle">
                                <a
                                    href={item.document}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    <Button className="border-0" disabled={item.documentAvailability === 'NA'}>
                                        <DownloadOutlined
                                            className={`text-green-400 ${item.documentAvailability === 'NA' ? 'opacity-50' : ''}`}
                                        />
                                    </Button>
                                </a>
                                <Button className="border-0">
                                    <DeleteOutlined
                                        className="text-[#E30000]"
                                        onClick={() => handleDelete(item)}
                                    />
                                </Button>
                                <Button className="border-0">
                                    <EditOutlined
                                        className="text-[#E30000]"
                                        onClick={() => handleEdit(item)}
                                    />
                                </Button>
                            </Space>
                        </Flex> */}
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default ChequeLeafMobileCard;
