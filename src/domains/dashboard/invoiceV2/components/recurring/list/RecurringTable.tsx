import { SyncOutlined } from '@ant-design/icons';
import { Flex, Pagination } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import type { RecurringScheduleApiData } from '../../../types/recurring';
import { buildRecurringColumns } from '../../../utils/table_column/recurringColumns';

interface RecurringTableProps {
    schedules: RecurringScheduleApiData[];
    isLoading: boolean;
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
    onView: (id: string) => void;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    isToggling?: boolean;
}

const RecurringTable = ({
    schedules,
    isLoading,
    total,
    page,
    pageSize,
    onPageChange,
    onView,
    onPause,
    onResume,
    isToggling,
}: RecurringTableProps) => (
    <div className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden">
        <GenericTable
            dataSource={schedules}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            columns={buildRecurringColumns({ onView, onPause, onResume, isToggling })}
            locale={{
                emptyText: (
                    <Flex vertical align="center" justify="center" className="py-8">
                        <SyncOutlined className="text-3xl text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No schedules match your filters.</p>
                    </Flex>
                ),
            }}
        />
        <Flex justify="flex-end" className="px-4 py-3 border-t border-gray-100">
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showTotal={t => `${t} records`}
                onChange={onPageChange}
            />
        </Flex>
    </div>
);

export default RecurringTable;
