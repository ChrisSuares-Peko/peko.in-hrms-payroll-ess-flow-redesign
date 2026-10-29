/* eslint-disable react/prop-types */
import { useState } from 'react';

import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, FileExcelOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Modal, Progress, Space, Table, Typography, Tag, Tooltip } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import BillAvenueWalletButton from './BillAvenueWalletButton';
import { BillerRecord, BillerTableParams, RefreshProgressEvent } from '../types/billers';
import { formatRelativeTime } from '../utils/dateUtils';

const { Search } = Input;
const { Text } = Typography;

interface BillerListProps {
    billers: BillerRecord[];
    total: number;
    activeCount: number;
    disabledCount: number;
    lastUpdated: string | null;
    isLoading: boolean;
    isRefreshing: boolean;
    isExporting: boolean;
    refreshProgress: RefreshProgressEvent | null;
    categories: string[];
    onEnable: (billerIds: string[]) => void;
    onDisable: (billerIds: string[]) => void;
    onRemove: (billerIds: string[]) => void;
    onTableChange: (params: BillerTableParams) => void;
    onRefresh: (selectedIds?: string[]) => void;
    onUpdateName: (billerId: string, billerName: string) => Promise<boolean>;
    onExportFetchLogs: (fromDate: string, toDate: string) => void;
}

const BillerList: React.FC<BillerListProps> = ({
    billers,
    total,
    activeCount,
    disabledCount,
    lastUpdated,
    isLoading,
    isRefreshing,
    isExporting,
    refreshProgress,
    categories,
    onEnable,
    onDisable,
    onRemove,
    onTableChange,
    onRefresh,
    onUpdateName,
    onExportFetchLogs,
}) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [currentParams, setCurrentParams] = useState<BillerTableParams>({ page: 1, pageSize: 10 });
    const [searchText, setSearchText] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ visible: boolean; billerIds?: string[] }>({ visible: false });
    const [disableModal, setDisableModal] = useState<{ visible: boolean; billerIds?: string[] }>({ visible: false });
    const [enableModal, setEnableModal] = useState<{ visible: boolean; billerIds?: string[] }>({ visible: false });
    const [editingBillerId, setEditingBillerId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    const startEditName = (record: BillerRecord) => {
        setEditingBillerId(record.billerId);
        setEditingName(record.billerName || '');
    };
    const cancelEditName = () => {
        setEditingBillerId(null);
        setEditingName('');
    };
    const saveEditName = async (record: BillerRecord) => {
        const trimmed = editingName.trim();
        if (!trimmed || trimmed === (record.billerName || '')) {
            cancelEditName();
            return;
        }
        setIsSavingName(true);
        const ok = await onUpdateName(record.billerId, trimmed);
        setIsSavingName(false);
        if (ok) cancelEditName();
    };
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportRange, setReportRange] = useState<[Dayjs, Dayjs] | null>(null);

    const handleConfirmReport = () => {
        if (!reportRange || !reportRange[0] || !reportRange[1]) return;
        onExportFetchLogs(reportRange[0].format('YYYY-MM-DD'), reportRange[1].format('YYYY-MM-DD'));
        setReportModalOpen(false);
    };

    const categoryFilters = categories.map(c => ({ text: c, value: c }));

    const columns: ColumnsType<BillerRecord> = [
        {
            title: 'Biller ID',
            dataIndex: 'billerId',
            key: 'billerId',
            sorter: true,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Name',
            dataIndex: 'billerName',
            key: 'billerName',
            sorter: true,
            render: (_: string | null, record: BillerRecord) => {
                if (editingBillerId === record.billerId) {
                    return (
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                size="small"
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                onPressEnter={() => saveEditName(record)}
                                autoFocus
                                maxLength={255}
                                disabled={isSavingName}
                            />
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => saveEditName(record)}
                                loading={isSavingName}
                            />
                            <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={cancelEditName}
                                disabled={isSavingName}
                            />
                        </Space.Compact>
                    );
                }
                return (
                    <Flex align="center" gap={6}>
                        <Text>{record.billerName || <Text type="secondary">—</Text>}</Text>
                        {record.hasMdmNameChanged && (
                            <Tooltip
                                title={(
                                    <span>
                                        Name in BBPS records has changed.
                                        <br />
                                        Latest MDM name: <strong>{record.mdmBillerName}</strong>
                                    </span>
                                )}
                            >
                                <Tag color="orange" icon={<ExclamationCircleOutlined />} style={{ marginInlineEnd: 0 }}>
                                    MDM changed
                                </Tag>
                            </Tooltip>
                        )}
                        <Tooltip title="Edit name">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => startEditName(record)}
                            />
                        </Tooltip>
                    </Flex>
                );
            },
        },
        {
            title: 'Category',
            dataIndex: 'billerCategory',
            key: 'billerCategory',
            sorter: true,
            filters: categoryFilters,
            filteredValue: currentParams.category ? [currentParams.category] : null,
            render: (text: string | null) => text || <Text type="secondary">—</Text>,
        },
        {
            title: 'Coverage',
            dataIndex: 'billerCoverage',
            key: 'billerCoverage',
            render: (text: string | null) => text || <Text type="secondary">—</Text>,
        },
        {
            title: 'MDM Data',
            key: 'hasMDMData',
            filters: [
                { text: 'Available', value: 'true' },
                { text: 'Missing', value: 'false' },
            ],
            filteredValue: currentParams.hasMDMData ? [currentParams.hasMDMData] : null,
            render: (_: unknown, record: BillerRecord) => (
                record.hasMDMData
                    ? <Tag color="green">Available</Tag>
                    : <Tag color="orange">Missing</Tag>
            ),
        },
        {
            title: 'Last MDM Update',
            dataIndex: 'mdmUpdatedAt',
            key: 'mdmUpdatedAt',
            sorter: true,
            render: (val: string | null) => val
                ? <Text type="secondary">{formatRelativeTime(val)}</Text>
                : <Text type="secondary">Never</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Disabled', value: 'disabled' },
            ],
            filteredValue: currentParams.status ? [currentParams.status] : null,
            render: (status: 'active' | 'disabled') => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? 'Active' : 'Disabled'}
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: BillerRecord) => (
                <Space>
                    {record.status === 'active' ? (
                        <>
                            <Tooltip title="Disable Biller">
                                <Button
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => setDisableModal({ visible: true, billerIds: [record.billerId] })}
                                    size="small"
                                >
                                    Disable
                                </Button>
                            </Tooltip>
                            <Tooltip title="Remove Biller">
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={() => setDeleteModal({ visible: true, billerIds: [record.billerId] })}
                                    size="small"
                                >
                                    Remove
                                </Button>
                            </Tooltip>
                        </>
                    ) : (
                        <>
                            <Tooltip title="Enable Biller">
                                <Button
                                    icon={<CheckCircleOutlined />}
                                    type="primary"
                                    onClick={() => setEnableModal({ visible: true, billerIds: [record.billerId] })}
                                    size="small"
                                >
                                    Enable
                                </Button>
                            </Tooltip>
                            <Tooltip title="Remove Biller">
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={() => setDeleteModal({ visible: true, billerIds: [record.billerId] })}
                                    size="small"
                                >
                                    Remove
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    };

    const selectedActiveIds = selectedRowKeys.filter(id => billers.some(b => b.billerId === id && b.status === 'active'));
    const selectedDisabledIds = selectedRowKeys.filter(id => billers.some(b => b.billerId === id && b.status === 'disabled'));

    const handleTableChange: TableProps<BillerRecord>['onChange'] = (pagination, filters, sorter) => {
        const s = sorter as SorterResult<BillerRecord>;
        let sortOrder: 'ASC' | 'DESC' | undefined;
        if (s.order === 'ascend') {
            sortOrder = 'ASC';
        } else if (s.order === 'descend') {
            sortOrder = 'DESC';
        } else {
            sortOrder = undefined;
        }
        const newParams: BillerTableParams = {
            page: pagination.current ?? 1,
            pageSize: pagination.pageSize ?? 10,
            sortField: s.field as string | undefined,
            sortOrder,
            status: (filters.status as FilterValue)?.[0] as string | undefined,
            category: (filters.billerCategory as FilterValue)?.[0] as string | undefined,
            hasMDMData: (filters.hasMDMData as FilterValue)?.[0] as string | undefined,
            search: currentParams.search,
        };
        setCurrentParams(newParams);
        setSelectedRowKeys([]);
        onTableChange(newParams);
    };

    const handleSearch = (value: string) => {
        const newParams: BillerTableParams = { ...currentParams, search: value || undefined, page: 1 };
        setCurrentParams(newParams);
        setSelectedRowKeys([]);
        onTableChange(newParams);
    };

    const handleConfirmDelete = () => {
        onRemove(deleteModal.billerIds!);
        setDeleteModal({ visible: false });
        setSelectedRowKeys([]);
    };

    const handleConfirmDisable = () => {
        onDisable(disableModal.billerIds!);
        setDisableModal({ visible: false });
        setSelectedRowKeys([]);
    };

    const handleConfirmEnable = () => {
        onEnable(enableModal.billerIds!);
        setEnableModal({ visible: false });
        setSelectedRowKeys([]);
    };

    const refreshPercent = refreshProgress
        ? Math.round((refreshProgress.batchNumber / refreshProgress.totalBatches) * 100)
        : 0;

    return (
        <div>
            <Flex justify="space-between" align="center" className="mb-4">
                <Flex vertical gap={4}>
                    <Text strong className="text-lg">
                        Biller Management
                    </Text>
                    <Text type="secondary">
                        {activeCount} active · {disabledCount} disabled · Last updated: {formatRelativeTime(lastUpdated ?? '')}
                    </Text>
                </Flex>
                <Flex align="center" gap={12}>
                    {isRefreshing && refreshProgress && (
                        <Flex vertical gap={4} style={{ minWidth: 220 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Batch {refreshProgress.batchNumber}/{refreshProgress.totalBatches} · {refreshProgress.totalFetched} fetched
                                {refreshProgress.failedCount > 0 && ` · ${refreshProgress.failedCount} failed`}
                            </Text>
                            <Progress percent={refreshPercent} size="small" showInfo={false} />
                        </Flex>
                    )}
                    <BillAvenueWalletButton />
                    <Button icon={<FileExcelOutlined />} loading={isExporting} onClick={() => { setReportRange(null); setReportModalOpen(true); }}>
                        Bill Fetch Report
                    </Button>
                    <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={() => onRefresh(selectedRowKeys.length > 0 ? selectedRowKeys : undefined)}>
                        Refresh MDM
                    </Button>
                </Flex>
            </Flex>

            <Modal
                title="Bill Fetch Report"
                open={reportModalOpen}
                onOk={handleConfirmReport}
                onCancel={() => setReportModalOpen(false)}
                okText="Download"
                okButtonProps={{ disabled: !reportRange || !reportRange[0] || !reportRange[1], loading: isExporting, className: 'bg-lightRed border-lightRed text-white disabled:opacity-50' }}
            >
                <Flex vertical gap={8}>
                    <Text type="secondary">Select a date range to download the bill fetch logs.</Text>
                    <DatePicker.RangePicker
                        format="YYYY-MM-DD"
                        value={reportRange}
                        onChange={(dates) => setReportRange(dates as [Dayjs, Dayjs] | null)}
                        disabledDate={(current) => current && current.isAfter(dayjs().endOf('day'))}
                        className="w-full"
                    />
                </Flex>
            </Modal>

            <Flex justify="space-between" align="center" className="mb-4">
                <Search
                    placeholder="Search by ID, name, category or coverage"
                    allowClear
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    onSearch={handleSearch}
                    style={{ width: 340 }}
                />
                {selectedRowKeys.length > 0 && (
                    <Space>
                        {selectedDisabledIds.length > 0 && (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => setEnableModal({ visible: true, billerIds: selectedDisabledIds })}
                            >
                                Enable ({selectedDisabledIds.length})
                            </Button>
                        )}
                        {selectedActiveIds.length > 0 && (
                            <Button
                                icon={<CloseCircleOutlined />}
                                onClick={() => setDisableModal({ visible: true, billerIds: selectedActiveIds })}
                            >
                                Disable ({selectedActiveIds.length})
                            </Button>
                        )}
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => setDeleteModal({ visible: true, billerIds: selectedRowKeys })}
                        >
                            Remove ({selectedRowKeys.length})
                        </Button>
                    </Space>
                )}
            </Flex>

            <Table
                columns={columns}
                dataSource={billers.map(b => ({ ...b, key: b.billerId }))}
                loading={isLoading}
                rowSelection={rowSelection}
                scroll={{ x: 'max-content' }}
                onChange={handleTableChange}
                pagination={{
                    current: currentParams.page,
                    pageSize: currentParams.pageSize,
                    total,
                    pageSizeOptions: [10, 50, 100, 200],
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} billers`,
                }}
            />

            <ConfirmationModal
                isOpen={deleteModal.visible}
                handleCancel={() => setDeleteModal({ visible: false })}
                handleSubmit={handleConfirmDelete}
                title={`Remove ${(deleteModal.billerIds?.length ?? 0) > 1 ? `${deleteModal.billerIds?.length} billers` : 'this biller'}?`}
                description="This action cannot be undone."
                isLoading={isLoading}
            />
            <ConfirmationModal
                isOpen={disableModal.visible}
                handleCancel={() => setDisableModal({ visible: false })}
                handleSubmit={handleConfirmDisable}
                title={`Disable ${(disableModal.billerIds?.length ?? 0) > 1 ? `${disableModal.billerIds?.length} active billers` : 'this biller'}?`}
                description="Disabled billers remain in the list but are inactive."
                isLoading={isLoading}
            />
            <ConfirmationModal
                isOpen={enableModal.visible}
                handleCancel={() => setEnableModal({ visible: false })}
                handleSubmit={handleConfirmEnable}
                title={`Enable ${(enableModal.billerIds?.length ?? 0) > 1 ? `${enableModal.billerIds?.length} disabled billers` : 'this biller'}?`}
                description="These billers will become active."
                isLoading={isLoading}
            />
        </div>
    );
};

export default BillerList;
