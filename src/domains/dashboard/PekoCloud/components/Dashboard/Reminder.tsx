import React from 'react';

import { Carousel, Col, Flex, Image, Row, Typography } from 'antd';

import ReminderCarousel from './ReminderCarousel';
import { EmptyReminders } from '../../assets/images/export';

const Reminder = ({ tableDatas }: { tableDatas: any[] }) => (
    <Col className="w-full">
        <Flex className="mt-4 mb-2" style={{ borderBottom: 'none' }}>
            <Typography.Text className="text-xl font-medium">Reminders</Typography.Text>
        </Flex>
        <Col>
            <Carousel dots={{ className: 'custom-slick-dots' }}>
                {tableDatas?.map((arr, i) => <ReminderCarousel arr={arr} key={i} />)}
            </Carousel>
            {tableDatas.length === 0 && (
                <Row>
                    <Flex
                        className="w-full h-40 my-10"
                        justify="center"
                        align="center"
                        gap="middle"
                        vertical
                    >
                        <Image preview={false} src={EmptyReminders} height={120} />

                        <Typography.Text className="text-sm font-light text-center text-titleText">
                            Looks like you’re up-to-date
                        </Typography.Text>
                    </Flex>
                </Row>
            )}
        </Col>
    </Col>
);

export default Reminder;
