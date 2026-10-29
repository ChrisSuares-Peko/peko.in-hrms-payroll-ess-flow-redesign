import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Input, Pagination, Table } from 'antd';
import type { Dayjs } from 'dayjs';
import { useDispatch } from 'react-redux';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import { useDeleteHolidayApi } from '../../hooks/dashboardHooks/useDeleteHolidayApi';
import { useHolidaysList } from '../../hooks/dashboardHooks/useHolidaysList';
import type { HolidayRecord } from '../../utils/timesheet/holidaysData';
import { holidaysColumns, holidaysExpandedRow, holidaysPrimaryColumns } from '../../utils/timesheet/holidaysData';
import { moreColumn, stripEmoji } from '../../utils/timesheet/tabHelpers';
import AddHolidaysModal from '../modals/AddHolidaysModal';

interface Props {
    refetchTrigger?: number;
}

const HolidaysTab = ({ refetchTrigger = 0 }: Props) => {
    const { xs } = useScreenSize();
    const dispatch = useDispatch();
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [start, setStart] = useState<string | undefined>();
    const [end, setEnd] = useState<string | undefined>();
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [category] = useState<string | undefined>();
    const [page, setPage] = useState(1);

    const [editRecord, setEditRecord] = useState<HolidayRecord | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [deleteKey, setDeleteKey] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { rows, pagination, isLoading, refetch } = useHolidaysList({ page, start, end, search, category });

    useEffect(() => {
        if (refetchTrigger > 0 || refresh) refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetchTrigger, refresh]);

    const { deleteHolidayData, isLoading: deleteLoading } = useDeleteHolidayApi({});

    const handleDelete = async () => {
        if (!deleteKey) return;
        const ok = await deleteHolidayData(deleteKey);
        setDeleteKey(null);
        if (ok) {
            dispatch(showToast({ description: 'Holiday deleted successfully', variant: 'success' }));
            refetch();
        } else {
            dispatch(showToast({ description: 'Failed to delete holiday', variant: 'error' }));
        }
    };

    const toggle = (key: string) =>
        setExpandedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

    const columns = xs
        ? [...holidaysPrimaryColumns, moreColumn(expandedKeys, toggle)]
        : holidaysColumns(
              record => {
                  setEditRecord(record);
                  setEditOpen(true);
              },
              key => setDeleteKey(key)
          );

    return (
        <>
            <AddHolidaysModal
                open={editOpen}
                holidayType="EDIT"
                holiDayData={
                    editRecord
                        ? {
                              id: editRecord.key,
                              title: editRecord.name,
                              start: { d: editRecord.rawStart },
                              end: { d: editRecord.rawEnd },
                              category: editRecord.rawCategory,
                              sendPriorEmailDate: editRecord.rawSendPriorEmailDate,
                          }
                        : null
                }
                handleCancel={() => {
                    setEditOpen(false);
                    setEditRecord(null);
                }}
                setRefresh={setRefresh}
                setHolidayData={setEditRecord}
            />

            <div className="flex justify-end mb-4">
                <div className="flex flex-wrap gap-3 w-1/2">
                    <div className="flex-1 min-w-[160px]">
                        <DatePicker.RangePicker
                            className="w-full"
                            onChange={(dates: [Dayjs | null, Dayjs | null] | null) => {
                                setStart(dates?.[0]?.format('YYYY-MM-DD'));
                                setEnd(dates?.[1]?.format('YYYY-MM-DD'));
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <Input
                            placeholder="Search..."
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
                loading={isLoading || deleteLoading}
                expandable={
                    xs
                        ? { expandedRowKeys: expandedKeys, expandedRowRender: holidaysExpandedRow, expandIcon: () => null, showExpandColumn: false }
                        : undefined
                }
                pagination={false}
                tableLayout="fixed"
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

            <ConfirmationModal
                isOpen={deleteKey !== null}
                title="Are you sure you want to delete this holiday?"
                handleSubmit={handleDelete}
                handleCancel={() => setDeleteKey(null)}
                isLoading={deleteLoading}
            />
        </>
    );
};

export default HolidaysTab;
