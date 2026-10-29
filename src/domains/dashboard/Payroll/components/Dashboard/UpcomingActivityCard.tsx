import React from 'react';

import { Card, Flex, Typography, Skeleton } from 'antd';

import { ActivityData } from '@domains/dashboard/Payroll/types/types';

export const formatDate = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const month = months[date.getMonth()]; // Month is zero-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${day} ${month} ${year}`;
};

const UpcomingActivityCard = ({ title, date, description, isLoading }: ActivityData) => (
    <Card
        className="xs:border-0 xs:rounded-none xs:bg-slate-100 md:rounded-md md:bg-white md:border"
        bordered
    >
        <Flex vertical gap="middle">
            {isLoading ? (
                <>
                    <Skeleton.Input style={{ width: 200, marginBottom: 8 }} active size="small" />
                    <Skeleton.Input
                        style={{ width: '100%', marginBottom: 8 }}
                        active
                        size="small"
                    />
                    <Skeleton.Input style={{ width: 100, marginBottom: 8 }} active size="small" />
                </>
            ) : (
                <>
                    <Typography.Text className="text-base font-medium">{title}</Typography.Text>
                    <Typography.Paragraph className=" pr-3">{description}</Typography.Paragraph>
                    {/* <Typography.Text className="text-end text-textGreen">{new Date(date).toISOString().split('T')[0]}</Typography.Text> */}
                    <Typography.Text className="text-end text-textGreen">
                        {formatDate(date)}
                    </Typography.Text>
                </>
            )}
        </Flex>
    </Card>
);

export default UpcomingActivityCard;
