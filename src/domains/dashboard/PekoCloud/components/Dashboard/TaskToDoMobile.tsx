import React from 'react';

import { Col, Flex, Image, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import UpcomingTaskCard from './UpcomingTaskCard';
import { EmptyAlerts } from '../../assets/images/export';

const TaskToDoMobile = ({ slicedToDoData }: { slicedToDoData: any[] }) => (
    <>
        <Flex justify="space-between" gap="middle">
            <Typography.Title className="ml-3" level={5}>
                Task to do
            </Typography.Title>
            <Link to={`/${paths.pekoCloud.index}/${paths.pekoCloud.taskToDo}`}>
                <Typography.Text className="text-base text-iconRed">View all</Typography.Text>
            </Link>
        </Flex>
        {slicedToDoData.length ? (
            <Row gutter={[40, 40]} className="mt-5 ">
                {slicedToDoData.map((item, i) => (
                    <Col xs={24} sm={12} md={8} lg={8} xl={8} key={i} className="pl-2">
                        <UpcomingTaskCard
                            item={{
                                ...item,
                                icon: '',
                            }}
                        />
                    </Col>
                ))}
            </Row>
        ) : (
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
        )}
    </>
);

export default TaskToDoMobile;
