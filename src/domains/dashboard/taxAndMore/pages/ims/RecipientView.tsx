import { SearchOutlined, WarningOutlined } from '@ant-design/icons';
import { Flex, Pagination, Skeleton, Typography } from 'antd';

import CountBadge from './CountBadge';
import { StatusFilter, TYPE_TABS, STATUS_FILTERS, TypeTab } from './imsUtils';
import SupplierRow from './SupplierRow';
import {
    ImsActionCounts,
    ImsHistoryEntry,
    ImsInvoiceStatus,
    ImsPagination,
    ImsSupplier,
    ImsTabCounts,
} from '../../types';

interface RecipientViewProps {
    isLoading: boolean;
    actioningId: string | null;
    saveHistory: ImsHistoryEntry[];
    reconciliationId: string | undefined;
    deadline?: string;
    reviewedCount?: number;
    totalCount?: number;
    filteredSuppliers: ImsSupplier[];
    tabCounts: ImsTabCounts | null;
    actionCounts: ImsActionCounts | null;
    pagination: ImsPagination | null;
    expandedId: string | null;
    activeTypeTab: TypeTab;
    activeStatusFilter: StatusFilter;
    search: string;
    onTypeTabChange: (t: TypeTab) => void;
    onStatusFilterChange: (f: StatusFilter) => void;
    onSearchChange: (v: string) => void;
    onPageChange: (page: number) => void;
    onToggleExpand: (id: string) => void;
    onInvoiceAction: (invId: string, s: ImsInvoiceStatus) => void;
}

const ACTION_LABELS: Record<string, string> = { save: 'Saved', reset: 'Reset' };

const RecipientView = ({
    isLoading,
    actioningId,
    saveHistory,
    reconciliationId,
    deadline,
    reviewedCount = 0,
    totalCount = 0,
    filteredSuppliers,
    tabCounts,
    actionCounts,
    pagination,
    expandedId,
    activeTypeTab,
    activeStatusFilter,
    search,
    onTypeTabChange,
    onStatusFilterChange,
    onSearchChange,
    onPageChange,
    onToggleExpand,
    onInvoiceAction,
}: RecipientViewProps) => {
    const statusCounts: Record<StatusFilter, number> = {
        all: actionCounts
            ? actionCounts.accepted +
              actionCounts.rejected +
              actionCounts.pending +
              actionCounts.noaction
            : 0,
        'to-review': actionCounts?.noaction ?? 0,
        accepted: actionCounts?.accepted ?? 0,
        rejected: actionCounts?.rejected ?? 0,
        pending: actionCounts?.pending ?? 0,
    };

    const typeCounts: Record<TypeTab, number> = {
        all: tabCounts?.all ?? 0,
        b2b: tabCounts?.b2b ?? 0,
        amendments: tabCounts?.amendments ?? 0,
        notes: tabCounts?.notes ?? 0,
        ecommerce: tabCounts?.ecom ?? 0,
    };

    const displaySuppliers = filteredSuppliers;

    const renderSupplierList = () => {
        if (isLoading) {
            return (
                <div className="px-6 py-6">
                    <Skeleton active />
                </div>
            );
        }
        if (displaySuppliers.length === 0) {
            const emptyText = reconciliationId ? 'No invoices found' : 'Starting reconciliation…';
            return (
                <Flex vertical align="center" gap={6} className="py-10">
                    <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                        {emptyText}
                    </Typography.Text>
                </Flex>
            );
        }
        return displaySuppliers.map(supplier => (
            <SupplierRow
                key={supplier.id}
                supplier={supplier}
                expanded={expandedId === supplier.id}
                invoiceStatuses={{}}
                actioningId={actioningId}
                onToggle={() => onToggleExpand(supplier.id)}
                onAction={onInvoiceAction}
            />
        ));
    };

    return (
        <Flex vertical gap={16}>
            <div
                className="border border-[#fcd34d] rounded-[14px] px-5 py-4 flex flex-wrap gap-3 items-center justify-between"
                style={{ backgroundColor: '#fffbeb' }}
            >
                <Flex gap={8} align="center" className="min-w-0">
                    <WarningOutlined style={{ fontSize: 18, color: '#f59e0b', flexShrink: 0 }} />
                    <Flex vertical gap={1} className="min-w-0">
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#f59e0b' }}
                        >
                            {deadline ? `Deadline: ${deadline}` : 'Deadline: —'}
                        </Typography.Text>
                        <Typography.Text className="text-[11px]" style={{ color: '#f59e0b' }}>
                            Unreviewed invoices are auto-accepted after this date
                        </Typography.Text>
                    </Flex>
                </Flex>
                <Flex gap={8} align="center" style={{ flexShrink: 0 }}>
                    <div
                        className="rounded-full overflow-hidden"
                        style={{ width: 100, height: 6, backgroundColor: '#ffd794' }}
                    >
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0}%`,
                                backgroundColor: '#f59e0b',
                            }}
                        />
                    </div>
                    <Typography.Text
                        className="text-xs font-medium whitespace-nowrap"
                        style={{ color: '#f59e0b' }}
                    >
                        {reviewedCount}/{totalCount} reviewed
                    </Typography.Text>
                </Flex>
            </div>

            <div className="border border-[#cbd5e1] rounded-[20px] overflow-hidden">
                <div className="bg-white px-6 pt-4">
                    <Flex gap={0} className="border-b border-[#e2e8f0] overflow-x-auto">
                        {TYPE_TABS.map(t => (
                            <button
                                key={t.key}
                                type="button"
                                className="px-5 py-3 text-sm font-normal transition-colors whitespace-nowrap"
                                style={{
                                    color: activeTypeTab === t.key ? '#ff4f4f' : '#1e293b',
                                    borderBottom:
                                        activeTypeTab === t.key
                                            ? '2px solid #ff4f4f'
                                            : '2px solid transparent',
                                    marginBottom: -1,
                                }}
                                onClick={() => onTypeTabChange(t.key)}
                            >
                                {t.label}{' '}
                                <span className="text-xs text-[#475569]">
                                    ({typeCounts[t.key]})
                                </span>
                            </button>
                        ))}
                    </Flex>

                    <Flex
                        align="center"
                        justify="space-between"
                        gap={8}
                        wrap="wrap"
                        className="py-3"
                    >
                        <Flex gap={8} wrap="wrap">
                            {STATUS_FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    type="button"
                                    className="rounded-full text-sm font-normal transition-colors"
                                    style={{
                                        height: 29,
                                        padding: '0 12px',
                                        backgroundColor:
                                            activeStatusFilter === f.key ? '#fef2f2' : '#f8fafc',
                                        color: activeStatusFilter === f.key ? '#ff4f4f' : '#1e293b',
                                        border: 'none',
                                    }}
                                    onClick={() => onStatusFilterChange(f.key)}
                                >
                                    {f.label} ({statusCounts[f.key]})
                                </button>
                            ))}
                        </Flex>
                        <div
                            className="flex items-center gap-3 border border-[#e4e4e7] rounded-lg px-4"
                            style={{
                                height: 36,
                                backgroundColor: 'white',
                                flex: '1 1 200px',
                                minWidth: 0,
                            }}
                        >
                            <SearchOutlined style={{ fontSize: 16, color: '#a1a1aa' }} />
                            <input
                                type="text"
                                placeholder="Search by supplier name or invoice no"
                                value={search}
                                onChange={e =>
                                    onSearchChange(
                                        e.target.value.replace(/\p{Extended_Pictographic}/gu, '')
                                    )
                                }
                                className="flex-1 outline-none border-none text-sm bg-transparent"
                                style={{ color: '#1e293b' }}
                            />
                        </div>
                    </Flex>
                </div>

                <div>{renderSupplierList()}</div>
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end">
                        <Pagination
                            current={pagination.page}
                            pageSize={pagination.limit}
                            total={pagination.totalSuppliers}
                            onChange={onPageChange}
                            showSizeChanger={false}
                            size="small"
                        />
                    </div>
                )}
            </div>

            <div className="mt-4 border border-[#cbd5e1] rounded-[20px] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#cbd5e1]">
                    <Typography.Text
                        className="font-semibold"
                        style={{ fontSize: 18, color: '#1e293b' }}
                    >
                        Save History
                    </Typography.Text>
                </div>
                {saveHistory.length === 0 ? (
                    <div className="px-6 py-6 text-center">
                        <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                            No saved changes yet
                        </Typography.Text>
                    </div>
                ) : (
                    saveHistory.map(entry => {
                        const actionLabel =
                            ACTION_LABELS[entry.action] ??
                            entry.action.charAt(0).toUpperCase() + entry.action.slice(1);
                        const formattedDate = new Date(entry.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                        });
                        const statusLabel =
                            entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
                        return (
                            <div
                                key={entry.id}
                                className="px-6 py-4 border-b border-[#f1f5f9] last:border-b-0"
                            >
                                <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                                    <Flex vertical gap={2}>
                                        <Typography.Text
                                            className="text-sm font-medium"
                                            style={{ color: '#1e293b' }}
                                        >
                                            {actionLabel} · {entry.invoiceCount} invoices
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-xs"
                                            style={{ color: '#94a3b8' }}
                                        >
                                            {entry.referenceId} · {formattedDate}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex gap={6} align="center" wrap="wrap">
                                        <CountBadge count={entry.acceptedCount} status="accepted" />
                                        <CountBadge count={entry.pendingCount} status="pending" />
                                        <CountBadge count={entry.rejectedCount} status="rejected" />
                                    </Flex>
                                    <span
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
                                    >
                                        {statusLabel}
                                    </span>
                                </Flex>
                            </div>
                        );
                    })
                )}
            </div>
        </Flex>
    );
};

export default RecipientView;
