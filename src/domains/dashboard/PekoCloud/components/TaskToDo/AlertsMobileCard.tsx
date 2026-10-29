import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Divider, Typography, Button, Col, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

interface HistoryCardProps {
    item: {
        title: string;
        date: string;
        type: string;
        status: string;
        actions: string;
    };
}

const AlertsMobileCard: React.FC<HistoryCardProps> = ({ item }) => {
    const [showMore, setShowMore] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSeeMore = () => {
        setShowMore(!showMore);
    };

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={11}>
                        <Flex gap={10} className="-ml-[.125rem]">
                            <Flex vertical justify="center">
                                <Typography.Text className="text-xs font-medium">
                                    {item?.title}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Col>
                    <Col xs={11}>
                        <Flex justify="center">
                            <Typography.Text className="text-green-500 text-xs">
                                {item.date}
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
                        <Flex justify="center">
                            <Flex justify="center" className="px-2">
                                <Button
                                    type="default"
                                    danger
                                    className="w-full px-5"
                                    size="small"
                                    onClick={() => {
                                        if (item.type === 'FLEETS' || item.type === 'FLEETS_DOCS') {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`
                                            );
                                        } else if (
                                            item.type === 'ASSETS' ||
                                            item.type === 'ASSETS_DOCS'
                                        ) {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`
                                            );
                                        } else if (item.type === 'COMPANY_DOCS') {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`
                                            );
                                        } else if (item.type === 'FINANCIAL_DOCS') {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
                                                {
                                                    state: {
                                                        tab: '3',
                                                    },
                                                }
                                            );
                                        } else if (item.type === 'OWNERS_DOCS') {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`
                                            );
                                        } else if (item.type === 'CHEQUE_LEAVES') {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
                                                {
                                                    state: {
                                                        tab: '1',
                                                    },
                                                }
                                            );
                                        } else if (item.type === 'SUBSCRIPTIONS') {
                                            navigate(
                                                `/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`
                                            );
                                        }
                                    }}
                                >
                                    Update
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default AlertsMobileCard;
