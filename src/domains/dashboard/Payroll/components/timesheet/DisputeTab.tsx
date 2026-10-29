import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Pagination, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

import { useDisputeRequests } from '../../hooks/dashboardHooks/useDisputeRequests';
import { useUpdateDisputeStatus } from '../../hooks/dashboardHooks/useUpdateDisputeStatus';
import { disputeColumns, disputeExpandedRow, disputePrimaryColumns, type DisputeRecord } from '../../utils/timesheet/disputeData';
import { moreColumn, stripEmoji } from '../../utils/timesheet/tabHelpers';

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'requestedByEmployee' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
];

const DisputeTab = () => {
    const { xs } = useScreenSize();
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [from, setFrom] = useState<string | undefined>();
    const [to, setTo] = useState<string | undefined>();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string | undefined>();
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { rows, pagination, isLoading, refetch } = useDisputeRequests({ page, from, to, status, search });
    const { review, isLoading: reviewLoading } = useUpdateDisputeStatus(refetch);

    const toggle = (key: string) =>
        setExpandedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

    const columns: ColumnsType<DisputeRecord> = xs
        ? [...disputePrimaryColumns, moreColumn(expandedKeys, toggle)]
        : disputeColumns(
              key => review(key, 'approved'),
              key => review(key, 'rejected')
          );

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="flex flex-wrap gap-3 w-1/2">
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
                    <div className="flex-1 min-w-[160px]">
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
                loading={isLoading || reviewLoading}
                expandable={
                    xs
                        ? { expandedRowKeys: expandedKeys, expandedRowRender: disputeExpandedRow, expandIcon: () => null, showExpandColumn: false }
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

export default DisputeTab;
