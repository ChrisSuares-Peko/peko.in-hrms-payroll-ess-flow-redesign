import React from 'react';

import { Grid, Pagination, PaginationProps, Table } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';

import NotificationsMobile from './NotificationMobile';
import { NotificationData } from '../types/index';

type Props = {
    data: NotificationData[];
    isLoading: boolean;
    current: number;
    handlePageChange: PaginationProps['onChange'];
    count?: number;
};

const NotificationTable = ({ data, isLoading, current, handlePageChange, count }: Props) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'date',
            render: (date: string) => <span>{formattedDateTime(new Date(date))}</span>,
        },

        {
            title: 'Notification Title',
            dataIndex: 'notificationTitle',
            key: 'title',
        },
        {
            title: 'Notification Brief',
            dataIndex: 'notificationBrief',
            key: 'brief',
        },
    ];

    return (
        <>
            {screens.xs ? (
                <NotificationsMobile data={data} isLoading={isLoading} />
            ) : (
                <Table
                    rowKey={record => record.id.toString()}
                    dataSource={data}
                    columns={columns}
                    bordered={false}
                    loading={isLoading}
                    pagination={false}
                />
            )}
            <Pagination
                current={current}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7"
                total={count}
                showSizeChanger={false}
                style={{ display: 'block' }}
            />
        </>
    );
};

export default React.memo(NotificationTable);
