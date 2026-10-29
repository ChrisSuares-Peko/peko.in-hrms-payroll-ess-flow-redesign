import React from 'react';

import { Flex, Tag, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import { TABLE_HEADER_STYLE } from '../../../constants/style';
import { DUMMY_DATA } from '../../../utils/dummyData';
import { scheduledReminderColumns } from '../../../utils/table_column/scheduledReminderColumns';

const ScheduledRemindersTable = () => (
    <Flex vertical gap={16}>
        <Flex align="center" gap={8}>
            <Typography.Text className="text-base font-semibold">
                Scheduled Reminders
            </Typography.Text>
            <Tag className="bg-[#FFF7ED] text-[#F97316] border-0 rounded-full px-2 py-0.5 text-xs font-normal">
                3 pending
            </Tag>
        </Flex>
        <Flex
            vertical
            className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
        >
            <GenericTable
                dataSource={DUMMY_DATA}
                columns={scheduledReminderColumns}
                rowKey="id"
                pagination={false}
                className="w-full"
                components={{
                    header: {
                        cell: ({
                            style,
                            ...rest
                        }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                            <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                        ),
                    },
                }}
            />
        </Flex>
    </Flex>
);

export default ScheduledRemindersTable;
