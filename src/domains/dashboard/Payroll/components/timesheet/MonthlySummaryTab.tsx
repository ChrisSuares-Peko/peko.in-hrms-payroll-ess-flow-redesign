import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Pagination, Table } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { useMonthlySummary } from '../../hooks/dashboardHooks/useMonthlySummary';
import { monthlySummaryColumns, monthlySummaryExpandedRow, monthlySummaryPrimaryColumns } from '../../utils/timesheet/monthlySummaryData';
import { moreColumn, stripEmoji } from '../../utils/timesheet/tabHelpers';

const MonthlySummaryTab = () => {
    const { xs } = useScreenSize();
    const [month, setMonth] = useState<string | undefined>();
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

    const { rows, pagination, isLoading } = useMonthlySummary({ month, search, page });

    const toggle = (key: string) =>
        setExpandedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

    const columns = xs ? [...monthlySummaryPrimaryColumns, moreColumn(expandedKeys, toggle)] : monthlySummaryColumns;

    return (
        <>
            <div className="flex justify-end mb-4">
                <div className="flex flex-wrap gap-3 w-1/4">
                    <div className="flex-1 min-w-[120px]">
                        <DatePicker
                            picker="month"
                            className="w-full"
                            placeholder="Select month"
                            onChange={d => {
                                setMonth(d ? d.format('YYYY-MM') : undefined);
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
                        ? { expandedRowKeys: expandedKeys, expandedRowRender: monthlySummaryExpandedRow, expandIcon: () => null, showExpandColumn: false }
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

export default MonthlySummaryTab;
