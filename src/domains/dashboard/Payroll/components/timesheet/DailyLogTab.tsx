import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Pagination, Select, Table } from 'antd';
import type { Dayjs } from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

import { useDailyLog } from '../../hooks/dashboardHooks/useDailyLog';
import { timesheetColumns, timesheetExpandedRow, timesheetPrimaryColumns } from '../../utils/timesheet/data';
import { moreColumn, stripEmoji } from '../../utils/timesheet/tabHelpers';

const STATUS_OPTIONS = [
    { label: 'Present', value: 'present' },
    { label: 'Late', value: 'late' },
    { label: 'Absent', value: 'absent' },
    { label: 'On Leave', value: 'on-leave' },
];

interface Props {
    refetchTrigger?: number;
}

const DailyLogTab = ({ refetchTrigger = 0 }: Props) => {
    const { xs } = useScreenSize();
    const [from, setFrom] = useState<string | undefined>();
    const [to, setTo] = useState<string | undefined>();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string | undefined>();
    const [page, setPage] = useState(1);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { rows, pagination, isLoading, refetch } = useDailyLog({ from, to, search, status, page });

    useEffect(() => {
        if (refetchTrigger > 0) refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetchTrigger]);

    const toggle = (key: string) =>
        setExpandedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

    const columns = xs ? [...timesheetPrimaryColumns, moreColumn(expandedKeys, toggle)] : timesheetColumns;

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="flex flex-wrap gap-3 w-2/3">
                    <div className="flex-1 min-w-[120px]">
                        <Select
                            placeholder="Status"
                            className="w-full"
                            allowClear
                            options={STATUS_OPTIONS}
                            value={status}
                            onChange={v => {
                                setStatus(v);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex-[2] min-w-[260px]">
                        <DatePicker.RangePicker
                            className="w-full"
                            onChange={(dates: [Dayjs | null, Dayjs | null] | null) => {
                                // Send the full selected day range in UTC so a same-day
                                // selection (from === to) still captures that day's
                                // records, which are stored as UTC timestamps.
                                setFrom(dates?.[0]?.startOf('day').toISOString());
                                setTo(dates?.[1]?.endOf('day').toISOString());
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <Input
                            placeholder="Search by name..."
                            prefix={<SearchOutlined />}
                            allowClear
                            value={searchInput}
                            onChange={e => {
                                const v = stripEmoji(e.target.value);
                                setSearchInput(v);
                                if (!v) setSearch('');
                            }}
                        />
                    </div>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                expandable={
                    xs
                        ? { expandedRowKeys: expandedKeys, expandedRowRender: timesheetExpandedRow, expandIcon: () => null, showExpandColumn: false }
                        : undefined
                }
                pagination={false}
                tableLayout={xs ? 'fixed' : 'auto'}
                scroll={xs ? undefined : { x: 'max-content' }}
                size="middle"
            />

            {pagination.total > pagination.limit && (
                <div className="flex justify-end mt-4">
                    <Pagination
                        current={page}
                        pageSize={pagination.limit}
                        total={pagination.total}
                        showSizeChanger={false}
                        onChange={p => setPage(p)}
                        size={xs ? 'small' : 'default'}
                    />
                </div>
            )}
        </>
    );
};

export default DailyLogTab;
