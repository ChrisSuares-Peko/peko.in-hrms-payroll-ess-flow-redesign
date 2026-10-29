import React, { useEffect, useMemo, useState } from 'react';

import { Pagination, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';

import { useLeaves } from '../../hooks/useLeaves';
import { HolidayUiRow } from '../../utils/leaveMappers';

const { Text } = Typography;

// const categoryColor = (category: string): string => {
//     const c = category.toLowerCase();
//     if (c.includes('religious')) return '#FA8C16';
//     if (c.includes('national')) return '#722ED1';
//     return '#8B8B8B';
// };

const PublicHolidaysTab: React.FC = () => {
    const { holidays, holidaysTotal, holidaysLimit, fetchHolidays } = useLeaves();
    const typeFilter = 'All';
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchHolidays({
            category: typeFilter === 'All' ? undefined : typeFilter,
            page,
        });
    }, [fetchHolidays, typeFilter, page]);

    // const handleTypeChange = (value: string) => {
    //     setTypeFilter(value);
    //     setPage(1);
    // };

    const rows = useMemo<HolidayUiRow[]>(
        () =>
            holidays.map(h => ({
                key: h.id,
                date: h.start ? dayjs(h.start).format('MMM D, YYYY') : '',
                endDate: h.end ? dayjs(h.end).format('MMM D, YYYY') : '',
                name: h.title,
                type: h.category,
            })),
        [holidays]
    );

    // Options are derived from the currently fetched page only — a category that
    // exists solely on another page won't appear here until that page is loaded.
    // Categories are HR-configured free text, so there's no fixed list to fall
    // back on and no dedicated distinct-categories endpoint yet.
    // const typeOptions = useMemo(() => {
    //     // Exclude the "allDay" value — it's not a real holiday type to filter by.
    //     const types = Array.from(new Set(rows.map(r => r.type))).filter(
    //         t => t && t.toLowerCase() !== 'allday'
    //     );
    //     return [{ value: 'All', label: 'All' }, ...types.map(t => ({ value: t, label: t }))];
    // }, [rows]);

    const columns: ColumnsType<HolidayUiRow> = [
        {
            title: 'Start date',
            dataIndex: 'date',
            key: 'date',
            width: 200,
            render: (text: string) => (
                <Text className="text-valueText text-sm font-medium">{text || '—'}</Text>
            ),
        },
        {
            title: 'End date',
            dataIndex: 'endDate',
            key: 'endDate',
            width: 200,
            render: (text: string) => (
                <Text className="text-valueText text-sm font-medium">{text || '—'}</Text>
            ),
        },
        {
            title: 'Holidays',
            dataIndex: 'name',
            key: 'name',
            width: 360,
            render: (text: string) => <Text className="text-valueText text-sm">{text}</Text>,
        },
        // {
        //     title: 'Holiday type',
        //     dataIndex: 'type',
        //     key: 'type',
        //     width: 160,
        //     align: 'right',
        //     render: (type: string) => {
        //         const color = categoryColor(type);
        //         return (
        //             <Tag
        //                 bordered={false}
        //                 className="rounded-full px-3"
        //                 style={{ color, backgroundColor: `${color}1A` }}
        //             >
        //                 {type}
        //             </Tag>
        //         );
        //     },
        // },
    ];

    return (
        <div className="mt-2">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <Text className="text-base font-semibold text-valueText">
                        Public Holidays Chart
                    </Text>
                    {/* <Select
                        value={typeFilter}
                        onChange={handleTypeChange}
                        options={typeOptions}
                        style={{ width: 160 }}
                    /> */}
                </div>

                <GenericTable rowKey="key" dataSource={rows} columns={columns} />
                {holidaysTotal > holidaysLimit && (
                    <div className="flex justify-end mt-4">
                        <Pagination
                            current={page}
                            pageSize={holidaysLimit}
                            total={holidaysTotal}
                            showSizeChanger={false}
                            onChange={p => setPage(p)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicHolidaysTab;
