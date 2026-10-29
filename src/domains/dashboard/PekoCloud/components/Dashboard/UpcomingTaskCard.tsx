import React from 'react';

import { Card, Flex, Typography, Skeleton, Button } from 'antd';
import { useNavigate } from 'react-router-dom'; // Ensure you have react-router-dom installed and configured

import { paths } from '@src/routes/paths';

import { TaskData } from '../../types/types';

const UpcomingTaskCard = ({ item }: { item: TaskData }) => {
    const navigate = useNavigate(); // Hook to navigate programmatically

    const handleAlertNavigate = () => {
        if (item.type === 'FLEETS' || item.type === 'FLEETS_DOCS') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`);
        } else if (item.type === 'ASSETS' || item.type === 'ASSETS_DOCS') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`);
        } else if (item.type === 'COMPANY_DOCS') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`);
        } else if (item.type === 'FINANCIAL_DOCS') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`, {
                state: {
                    tab: '3',
                },
            });
        } else if (item.type === 'OWNERS_DOCS') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`);
        } else if (item.type === 'CHEQUE_LEAVES') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`, {
                state: {
                    tab: '1',
                },
            });
        } else if (item.type === 'SUBSCRIPTIONS') {
            navigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`);
        }
    };

    return (
        <Card className="rounded-md md:bg-white" bordered>
            <Flex vertical gap="middle">
                {item.isLoading ? (
                    <>
                        <Skeleton.Input
                            style={{ width: 200, marginBottom: 8 }}
                            active
                            size="small"
                        />
                        <Skeleton.Input
                            style={{ width: '100%', marginBottom: 8 }}
                            active
                            size="small"
                        />
                        <Skeleton.Input
                            style={{ width: 100, marginBottom: 8 }}
                            active
                            size="small"
                        />
                    </>
                ) : (
                    <Flex vertical gap={10}>
                        <Flex gap="small" className="" align="center">
                            <Flex className="" vertical gap="small">
                                <Typography.Text className="">{item.title}</Typography.Text>
                            </Flex>
                        </Flex>
                        <Flex justify="space-between">
                            <Typography.Text className=" text-textLightGray  ">
                                {item.date}
                            </Typography.Text>
                            <Button
                                danger
                                type="default"
                                className="text-xs"
                                size="small"
                                onClick={handleAlertNavigate}
                            >
                                Update Now
                            </Button>
                        </Flex>
                    </Flex>
                )}
            </Flex>
        </Card>
    );
};

export default UpcomingTaskCard;
