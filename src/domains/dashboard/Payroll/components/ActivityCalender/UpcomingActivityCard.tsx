import React from 'react';

import { Col, Divider, Flex, Typography } from 'antd';

import ActivityCard from '@domains/dashboard/Payroll/components/ActivityCalender/ActivityCard';

type Props = {
    setRefresh: (value: any) => void;
    data: any;
    isLoading: boolean;
};

const UpcomingActivityCard = ({ setRefresh, data, isLoading }: Props) => {
    const renderContent = () => {
        if (isLoading) {
            return <ActivityCard data={data} setRefresh={setRefresh} isLoading={isLoading} />;
        }

        if (data && data.length > 0) {
            return <ActivityCard data={data} setRefresh={setRefresh} isLoading={isLoading} />;
        }

        return (
            <Typography.Text className="px-5">No activities currently available</Typography.Text>
        );
    };

    return (
        <Col xs={24} md={8}>
            <Flex vertical className="w-full border rounded-lg pb-4">
                <Flex gap={10} justify="space-between" align="center" className="px-5 mt-5">
                    <Typography.Text className="font-medium">Upcoming Activities</Typography.Text>
                </Flex>
                <Divider className="w-full" />
                {/* <ActivityCard data={data} setRefresh={setRefresh} isLoading={isLoading} /> */}
                {renderContent()}
            </Flex>
        </Col>
    );
};

export default UpcomingActivityCard;
