import React, { useState } from 'react';

import { RightOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row, Space, Spin } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import defaultCompanyDoc from '@domains/dashboard/PekoCloud/assets/icons/defaultCompanyDoc.svg';

import { formatDate } from '../../utils/helperFunctions';

interface HistoryCardProps {
    item: {
        documentName: string;
        documentNumber: string;
        documentType: string;
        issueDate: string;
        expireDate: string;
        status: string;
        actions: string;
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

const CompanyDocMobileCard: React.FC<HistoryCardProps> = ({
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
        { label: 'Document Number', value: item.documentNumber },
        { label: 'Issued Date', value: formatDate(item.issueDate) },
        { label: 'Expiry Date', value: formatDate(item.expireDate) },
    ];
    let colorClass = '';
    if (item.status === 'Active') {
        colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
    } else if (item.status === 'Expired') {
        colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
    }
    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex gap={10} className="-ml-[.125rem]">
                            <Flex align="center" justify="start">
                                <ReactSVG src={defaultCompanyDoc} />
                            </Flex>
                            <Flex vertical justify="center">
                                <Typography.Text className="text-xs font-medium">
                                    {item.documentName}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text
                                className={`text-xs font-normal px-3 py-1 rounded-2xl whitespace-nowrap text-center ${colorClass}`}
                            >
                                {item.status}
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
                            {item.documentNumber && item.issueDate ? (
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
                                            item.documentAvailability === 'NA' ||
                                            loadingRows[item.id]
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
                            ) : (
                                <Flex justify="center" className="px-2">
                                    <Button
                                        type="default"
                                        danger
                                        className="w-full px-5"
                                        size="small"
                                        onClick={() => handleEdit(item)}
                                    >
                                        Update
                                    </Button>
                                </Flex>
                            )}
                        </Flex>
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default CompanyDocMobileCard;
