import React from 'react';

import { Button, Flex, Image, List, Row, Skeleton, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { EmptyAlerts } from '../../assets/images/export';

const TaskToDo = ({
    isLoading,
    toDoData,
    slicedToDoData,
}: {
    isLoading: boolean;
    toDoData: any[];
    slicedToDoData: any[];
}) => {
    const navigate = useNavigate();
    const handleAlertNavigate = (item: any) => {
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
    return isLoading ? (
        <>
            {Array.from({ length: toDoData.length || 5 }, (_, i) => (
                <div key={i}>
                    <Skeleton.Input
                        style={{ width: 200, marginBottom: 8, marginTop: 4 }}
                        active
                        size="small"
                    />
                    <Skeleton
                        style={{ width: 700, marginBottom: 8, marginTop: 4 }}
                        active
                        title={false}
                        paragraph={{ rows: 1, width: ['50%', '100%'] }}
                    />
                    <Skeleton
                        style={{ width: 700, marginBottom: 8, marginTop: 4 }}
                        active
                        title={false}
                        paragraph={{ rows: 1, width: ['50%', '100%'] }}
                    />
                </div>
            ))}
        </>
    ) : (
        <List
            className="overflow-auto md:border-l md:border-b"
            style={{ minHeight: '110vh' }}
            bordered={false}
            dataSource={slicedToDoData}
            header={
                <Flex
                    className="pl-6 mt-2 mb-2"
                    justify="space-between"
                    style={{ borderBottom: 'none' }}
                >
                    <Typography.Text className="text-xl font-medium">Task to do</Typography.Text>
                    <Link to={`/${paths.pekoCloud.index}/${paths.pekoCloud.taskToDo}`}>
                        <Typography.Text className="text-base text-iconRed">
                            View all
                        </Typography.Text>
                    </Link>
                </Flex>
            }
            locale={{
                emptyText: (
                    <Flex
                        className="w-full h-40 my-10"
                        justify="center"
                        align="center"
                        gap="middle"
                        vertical
                    >
                        <Image preview={false} src={EmptyAlerts} height={120} />

                        <Typography.Text className="text-sm font-light text-center text-titleText">
                            Update document to show task to do
                        </Typography.Text>
                    </Flex>
                ),
            }}
            renderItem={(item, i) => (
                <List.Item key={i} className="min-w-full">
                    <Flex vertical className="min-w-full">
                        <Flex gap="small" className="p-2" align="center">
                            <Row className="px-4 mt-2">
                                <Typography.Text className="w-full text-xs">
                                    {item.title ?? ''}
                                </Typography.Text>
                                <Typography.Text className="text-xs text-textGreen">
                                    {item.date ?? ''}
                                </Typography.Text>
                            </Row>
                        </Flex>
                        <Flex justify="end">
                            <Button
                                danger
                                type="default"
                                className="text-xs"
                                size="small"
                                onClick={() => {
                                    handleAlertNavigate(item);
                                }}
                            >
                                Update Now
                            </Button>
                        </Flex>
                    </Flex>
                </List.Item>
            )}
        />
    );
};

export default TaskToDo;
