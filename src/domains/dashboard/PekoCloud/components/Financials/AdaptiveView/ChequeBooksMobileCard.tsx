import React, { useState } from 'react';

import { RightOutlined, DeleteOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space, Spin } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

interface HistoryCardProps {
    item: {
        bookId: string;
        accountName: string;
        accountNumber: string;
        bankName: string;
        accountBalance: string;
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
    handleDocDownload: (record: any) => void;
    loadingRows: any;
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

const ChequeBooksMobileCard: React.FC<HistoryCardProps> = ({
    item,
    handleDelete,
    handleEdit,
    handleDocDownload,
    loadingRows,
}) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    const details = [
        { label: 'Account Name', value: item?.accountName },
        { label: 'Account Number', value: item?.accountNumber },
        { label: 'Bank Name', value: item?.bankName },
        {
            label: 'Account Balance',
            value: item?.accountBalance
                ? `₹ ${formatNumberWithLocalString(item.accountBalance)}`
                : '₹ 0.00',
        },
    ];
    let colorClass = '';
    if (item?.status === 'Active') {
        colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    } else if (item?.status === 'Issued' || item?.status === 'Reissued') {
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
                            <Link
                                style={{ color: '#101828', textDecoration: 'none' }}
                                to={`/${paths.pekoCloud.index}/${paths.pekoCloud.financials}/${paths.pekoCloud.chequeBookDetails}`}
                                state={{
                                    chequeBookId: item?.id,
                                }}
                            >
                                <Flex vertical justify="center">
                                    <Typography.Text className="text-xs font-medium">
                                        {item?.bookId}
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
                                {/* <a
                                        href={item.document}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                    > */}
                                <Button
                                    className="border-0"
                                    disabled={
                                        item.documentAvailability === 'NA' || loadingRows[item.id]
                                    }
                                    onClick={() => handleDocDownload(item)}
                                >
                                    {loadingRows[item.id] ? (
                                        <Spin size="small" className="text-xs" />
                                    ) : (
                                        <DownloadOutlined
                                            className={`text-green-400 ${item.documentAvailability === 'NA' ? 'opacity-50' : ''}`}
                                        />
                                    )}
                                </Button>
                                {/* </a> */}
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

export default ChequeBooksMobileCard;
