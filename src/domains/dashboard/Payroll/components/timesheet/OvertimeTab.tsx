import { useState } from 'react';

import { Modal, Pagination, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import useScreenSize from '@src/hooks/useScreenSize';

import { useOvertime } from '../../hooks/dashboardHooks/useOvertime';
import { useUpdateOvertime } from '../../hooks/dashboardHooks/useUpdateOvertime';
import { useUpdateOvertimeStatus } from '../../hooks/dashboardHooks/useUpdateOvertimeStatus';
import {
    overtimeColumns,
    overtimeExpandedRow,
    overtimePrimaryColumns,
    type OvertimeRecord,
} from '../../utils/timesheet/overtimeData';
import { moreColumn } from '../../utils/timesheet/tabHelpers';
import EditOvertimeModal from '../modals/EditOvertimeModal';
import OvertimeDetailsModal from '../modals/OvertimeDetailsModal';

const STATUS_OPTIONS = [
    { label: 'Requested', value: 'requestedByEmployee' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Cancelled by Employee', value: 'cancelledByEmployee' },
];

const OvertimeTab = () => {
    const { xs } = useScreenSize();
    const [status, setStatus] = useState<string | undefined>();
    const [page, setPage] = useState(1);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    const [viewId, setViewId] = useState<string | null>(null);
    const [viewOpen, setViewOpen] = useState(false);

    const [editRecord, setEditRecord] = useState<OvertimeRecord | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const { rows, totalCount, limit, isLoading, refetch } = useOvertime({ status, page });
    const { update: updateStatus, isLoading: statusLoading } = useUpdateOvertimeStatus(refetch);
    const { update: updateRate, isLoading: editLoading } = useUpdateOvertime(() => {
        refetch();
        setEditOpen(false);
        setEditRecord(null);
    });

    const toggle = (key: string) =>
        setExpandedKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );

    const handleReject = (key: string) => {
        Modal.confirm({
            title: 'Reject Overtime Request',
            content: 'Are you sure you want to reject this request?',
            okText: 'Reject',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => updateStatus({ overtimeId: key, status: 'rejected' }),
        });
    };

    const columns: ColumnsType<OvertimeRecord> = xs
        ? [...overtimePrimaryColumns, moreColumn(expandedKeys, toggle)]
        : overtimeColumns(
              key => updateStatus({ overtimeId: key, status: 'approved' }),
              handleReject,
              key => {
                  setViewId(key);
                  setViewOpen(true);
              },
              record => {
                  setEditRecord(record);
                  setEditOpen(true);
              }
          );

    const closeEdit = () => {
        setEditOpen(false);
        setEditRecord(null);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Select
                    placeholder="Status"
                    style={{ width: 180 }}
                    allowClear
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={v => {
                        setStatus(v);
                        setPage(1);
                    }}
                />
            </div>

            <Table
                columns={columns}
                dataSource={rows}
                loading={isLoading || statusLoading || editLoading}
                expandable={
                    xs
                        ? {
                              expandedRowKeys: expandedKeys,
                              expandedRowRender: overtimeExpandedRow,
                              expandIcon: () => null,
                              showExpandColumn: false,
                          }
                        : undefined
                }
                pagination={false}
                tableLayout={xs ? 'fixed' : 'auto'}
                scroll={xs ? undefined : { x: 'max-content' }}
                size="middle"
            />

            {totalCount > limit && (
                <div className="flex justify-end mt-4">
                    <Pagination
                        current={page}
                        pageSize={limit}
                        total={totalCount}
                        showSizeChanger={false}
                        onChange={p => setPage(p)}
                        size={xs ? 'small' : 'default'}
                    />
                </div>
            )}

            <OvertimeDetailsModal
                open={viewOpen}
                overtimeId={viewId}
                onClose={() => {
                    setViewOpen(false);
                    setViewId(null);
                }}
            />

            <EditOvertimeModal
                open={editOpen}
                overtimeId={editRecord?.key ?? null}
                initialValues={
                    editRecord
                        ? {
                              employeeId: editRecord.employeeId,
                              overTimeDate: editRecord.rawDate,
                              extraHours: editRecord.extraHours,
                              overTimeRate: editRecord.overtimeRate,
                              totalWorkingHours: editRecord.totalWorkingHours,
                              hourlyRate: editRecord.hourlyRate,
                              overtimeAmount: editRecord.overtimeAmount,
                              notes: editRecord.notes,
                          }
                        : null
                }
                isLoading={editLoading}
                onSubmit={updateRate}
                onClose={closeEdit}
            />
        </>
    );
};

export default OvertimeTab;
