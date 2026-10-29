import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Pagination, Table } from 'antd';
import type { Dayjs } from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

import { useShiftSchedule } from '../../hooks/dashboardHooks/useShiftSchedule';
import { shiftScheduleColumns, shiftScheduleExpandedRow, shiftSchedulePrimaryColumns } from '../../utils/timesheet/shiftScheduleData';
import { moreColumn, stripEmoji } from '../../utils/timesheet/tabHelpers';

const ShiftScheduleTab = () => {
    const { xs } = useScreenSize();
    const [from, setFrom] = useState<string | undefined>();
    const [to, setTo] = useState<string | undefined>();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { rows, dayLabels, pagination, isLoading } = useShiftSchedule({ from, to, search, page });

    const toggle = (key: string) =>
        setExpandedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

    const columns = xs ? [...shiftSchedulePrimaryColumns, moreColumn(expandedKeys, toggle)] : shiftScheduleColumns(dayLabels);

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="flex flex-wrap gap-3 w-2/5">
                    <div className="flex-1 min-w-[120px]">
                        <DatePicker.RangePicker
                            className="w-full"
                            onChange={(dates: [Dayjs | null, Dayjs | null] | null) => {
                                setFrom(dates?.[0]?.format('YYYY-MM-DD'));
                                setTo(dates?.[1]?.format('YYYY-MM-DD'));
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
                        ? { expandedRowKeys: expandedKeys, expandedRowRender: shiftScheduleExpandedRow, expandIcon: () => null, showExpandColumn: false }
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

export default ShiftScheduleTab;
