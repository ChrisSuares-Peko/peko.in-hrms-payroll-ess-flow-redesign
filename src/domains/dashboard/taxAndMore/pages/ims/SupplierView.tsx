import { useMemo, useState } from 'react';

import {
    DownOutlined,
    InfoCircleOutlined,
    RightOutlined,
    SearchOutlined,
    UpOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CountBadge from './CountBadge';
import { fmt } from './imsUtils';
import {
    AddedBackLiability,
    ImsHistoryEntry,
    ImsSupplierCustomer,
    ImsSupplierInvoice,
} from '../../types';

type SupplierSubTab = 'sales-invoices' | 'added-back' | 'history';

const SUPPLIER_SUB_TABS: { key: SupplierSubTab; label: string }[] = [
    { key: 'sales-invoices', label: 'Sales Invoices' },
    { key: 'added-back', label: 'Added Back Liabilities' },
    { key: 'history', label: 'History' },
];

const RESPONSE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    A: { label: 'Accepted', color: '#43b75d', bg: '#ecfdf5' },
    R: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
    P: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
};

const COLS = '0.7fr 1.2fr 1fr 1.1fr 1fr 1.2fr 1.1fr';
const HEADERS = [
    'Type',
    'Invoice No',
    'Date',
    'Taxable (₹)',
    'Tax (₹)',
    "Customer's Response",
    'Next Step',
];

const invoiceTypeToAmendTab = (type: string): string => {
    const t = type.toUpperCase();
    if (t.includes('CDNUR')) return 'cdnura';
    if (t.includes('CDN') || t.includes('CN') || t.includes('DN')) return 'cdnra';
    if (t.includes('EXP')) return 'expa';
    if (t.includes('B2CL')) return 'b2cla';
    if (t.includes('B2CS')) return 'b2csa';
    return 'b2ba';
};

const formatOrigPeriod = (invoiceDate: string): string => {
    const parts = invoiceDate?.split('-') ?? [];
    return parts.length >= 2 ? `${parts[1]}${parts[0]}` : '';
};

const renderNextStep = (inv: ImsSupplierInvoice, onAmend: (i: ImsSupplierInvoice) => void) => {
    if (inv.customerAction === 'R') {
        return (
            <button
                type="button"
                className="text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap"
                style={{ border: '1px solid #fca5a5', color: '#ef4444', backgroundColor: 'white' }}
                onClick={() => onAmend(inv)}
            >
                Amend in GSTR-1A
            </button>
        );
    }
    if (inv.customerAction === 'P') {
        return (
            <Typography.Text className="text-xs" style={{ color: '#f59e0b' }}>
                Follow up
            </Typography.Text>
        );
    }
    return (
        <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
            —
        </Typography.Text>
    );
};

const CustomerGroupRow = ({
    group,
    onAmend,
}: {
    group: ImsSupplierCustomer;
    onAmend: (inv: ImsSupplierInvoice) => void;
}) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border-b border-[#cbd5e1] last:border-b-0">
            <button
                type="button"
                className="w-full text-left px-4 sm:px-6 hover:bg-[#fafafa] transition-colors"
                onClick={() => setExpanded(p => !p)}
            >
                <div className="py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                        {group.customerName && (
                            <Typography.Text
                                className="font-semibold text-sm block"
                                style={{ color: '#1e293b' }}
                            >
                                {group.customerName}
                            </Typography.Text>
                        )}
                        <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                            {group.customerGstin}
                        </Typography.Text>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                        {group.accepted > 0 && (
                            <span
                                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                                style={{ backgroundColor: '#ecfdf5', color: '#43b75d' }}
                            >
                                {group.accepted} Accepted
                            </span>
                        )}
                        {group.pending > 0 && (
                            <span
                                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                                style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}
                            >
                                {group.pending} Pending
                            </span>
                        )}
                        {group.rejected > 0 && (
                            <span
                                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                            >
                                {group.rejected} Rejected
                            </span>
                        )}
                        {expanded ? (
                            <UpOutlined style={{ fontSize: 14, color: '#475569' }} />
                        ) : (
                            <DownOutlined style={{ fontSize: 14, color: '#475569' }} />
                        )}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="overflow-x-auto border-t border-[#e2e8f0]">
                    <div style={{ minWidth: 740 }}>
                        <div
                            className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                            style={{ gridTemplateColumns: COLS }}
                        >
                            {HEADERS.map(h => (
                                <div
                                    key={h}
                                    className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap"
                                    style={{ color: '#42526d' }}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                        {group.invoices.map((inv, idx) => {
                            const resp = RESPONSE_CONFIG[inv.customerAction ?? ''];
                            return (
                                <div
                                    key={`${inv.invoiceNo}-${idx}`}
                                    className="grid items-center border-b border-[#eaecf0] last:border-b-0 bg-white"
                                    style={{ gridTemplateColumns: COLS, minHeight: 52 }}
                                >
                                    <div className="px-4 py-3 text-sm text-[#1e293b]">
                                        {inv.invoiceType}
                                    </div>
                                    <div className="px-4 py-3 text-sm text-[#1e293b] whitespace-nowrap">
                                        {inv.invoiceNo}
                                    </div>
                                    <div
                                        className="px-4 py-3 text-sm whitespace-nowrap"
                                        style={{ color: '#42526d' }}
                                    >
                                        {inv.invoiceDate || '—'}
                                    </div>
                                    <div
                                        className="px-4 py-3 text-sm whitespace-nowrap"
                                        style={{ color: '#42526d' }}
                                    >
                                        ₹ {fmt(inv.taxableAmount)}
                                    </div>
                                    <div
                                        className="px-4 py-3 text-sm whitespace-nowrap"
                                        style={{ color: '#42526d' }}
                                    >
                                        ₹ {fmt(inv.totalTax)}
                                    </div>
                                    <div className="px-4 py-3">
                                        {resp ? (
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: resp.bg,
                                                    color: resp.color,
                                                }}
                                            >
                                                {resp.label}
                                            </span>
                                        ) : (
                                            <span
                                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                No response
                                            </span>
                                        )}
                                    </div>
                                    <div className="px-4 py-3">{renderNextStep(inv, onAmend)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const ACTION_LABELS: Record<string, string> = { save: 'Saved', reset: 'Reset' };

interface SupplierViewProps {
    customers: ImsSupplierCustomer[];
    isLoading: boolean;
    liabilities: AddedBackLiability[];
    isLiabilitiesLoading: boolean;
    saveHistory: ImsHistoryEntry[];
    search: string;
    onSearchChange: (v: string) => void;
}

const SupplierView = ({
    customers,
    isLoading,
    liabilities,
    isLiabilitiesLoading,
    saveHistory,
    search,
    onSearchChange,
}: SupplierViewProps) => {
    const navigate = useNavigate();
    const [activeSubTab, setActiveSubTab] = useState<SupplierSubTab>('sales-invoices');

    const handleAmend = (inv: ImsSupplierInvoice) => {
        navigate(`${paths.dashboard.taxMore}/${paths.taxMore.fileGstr1}`, {
            state: {
                amendInvoice: {
                    origInvNo: inv.invoiceNo,
                    origPeriod: formatOrigPeriod(inv.invoiceDate),
                    receiverGstin: inv.customerGstin,
                    receiverName: inv.customerName ?? '',
                    taxableAmount: inv.taxableAmount,
                    amendTab: invoiceTypeToAmendTab(inv.invoiceType),
                },
            },
        });
    };

    const totalRejected = useMemo(
        () => customers.reduce((sum, c) => sum + c.rejected, 0),
        [customers]
    );

    const renderSalesContent = () => {
        if (isLoading)
            return (
                <div className="px-6 py-6">
                    <Skeleton active />
                </div>
            );
        if (customers.length === 0) {
            return (
                <Flex vertical align="center" gap={6} className="py-10">
                    <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                        {search ? 'No invoices match your search' : 'No invoices found'}
                    </Typography.Text>
                </Flex>
            );
        }
        return customers.map(group => (
            <CustomerGroupRow key={group.customerGstin} group={group} onAmend={handleAmend} />
        ));
    };

    const renderAddedBackContent = () => {
        if (isLiabilitiesLoading)
            return (
                <div className="px-6 py-6">
                    <Skeleton active />
                </div>
            );
        if (liabilities.length === 0) {
            return (
                <Flex vertical align="center" gap={6} className="py-10">
                    <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                        No added-back liabilities
                    </Typography.Text>
                </Flex>
            );
        }
        return (
            <div className="overflow-x-auto">
                <div style={{ minWidth: 680 }}>
                    <div
                        className="grid bg-[#fafbfb] border-b border-[#eaecf0]"
                        style={{ gridTemplateColumns: '0.7fr 1fr 1.5fr 0.8fr 1.1fr 1fr' }}
                    >
                        {['Type', 'Invoice No', 'Customer', 'Period', 'Taxable (₹)', 'Tax (₹)'].map(
                            h => (
                                <div
                                    key={h}
                                    className="px-4 py-3 text-xs font-semibold whitespace-nowrap"
                                    style={{ color: '#42526d' }}
                                >
                                    {h}
                                </div>
                            )
                        )}
                    </div>
                    {liabilities.map((row, idx) => (
                        <div
                            key={`${row.invoiceNo}-${idx}`}
                            className="grid items-center border-b border-[#eaecf0] last:border-b-0 bg-white hover:bg-[#fafafa] transition-colors"
                            style={{
                                gridTemplateColumns: '0.7fr 1fr 1.5fr 0.8fr 1.1fr 1fr',
                                minHeight: 56,
                            }}
                        >
                            <div className="px-4 py-3">
                                <span
                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                                >
                                    {row.type.toUpperCase()}
                                </span>
                            </div>
                            <div className="px-4 py-3 text-sm text-[#1e293b] whitespace-nowrap">
                                {row.invoiceNo}
                            </div>
                            <div className="px-4 py-3 min-w-0">
                                {row.customerName && (
                                    <Typography.Text
                                        className="text-sm font-medium block truncate"
                                        style={{ color: '#1e293b' }}
                                    >
                                        {row.customerName}
                                    </Typography.Text>
                                )}
                                <Typography.Text className="text-xs" style={{ color: '#475569' }}>
                                    {row.customerGstin}
                                </Typography.Text>
                            </div>
                            <div
                                className="px-4 py-3 text-sm whitespace-nowrap"
                                style={{ color: '#42526d' }}
                            >
                                {row.supplyPeriod}
                            </div>
                            <div
                                className="px-4 py-3 text-sm whitespace-nowrap"
                                style={{ color: '#42526d' }}
                            >
                                ₹ {fmt(row.taxableAmount)}
                            </div>
                            <div
                                className="px-4 py-3 text-sm whitespace-nowrap"
                                style={{ color: '#42526d' }}
                            >
                                ₹ {fmt(row.totalTax)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderHistoryContent = () => {
        if (saveHistory.length === 0) {
            return (
                <div className="px-6 py-8 text-center">
                    <Typography.Text className="text-sm" style={{ color: '#94a3b8' }}>
                        No saved changes yet
                    </Typography.Text>
                </div>
            );
        }
        return saveHistory.map(entry => {
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
            const statusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
            return (
                <div key={entry.id} className="px-6 py-4 border-b border-[#f1f5f9] last:border-b-0">
                    <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                        <Flex vertical gap={2}>
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: '#1e293b' }}
                            >
                                {actionLabel} · {entry.invoiceCount} invoices
                            </Typography.Text>
                            <Typography.Text className="text-xs" style={{ color: '#94a3b8' }}>
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
        });
    };

    return (
        <Flex vertical gap={16}>
            <Flex
                align="center"
                justify="space-between"
                className="border border-[#fca5a5] rounded-[14px] px-5 py-4"
                style={{ backgroundColor: '#fef2f2' }}
            >
                <Flex gap={8} align="center">
                    <WarningOutlined style={{ fontSize: 18, color: '#ef4444' }} />
                    <Flex vertical gap={1}>
                        <Typography.Text
                            className="text-xs font-medium"
                            style={{ color: '#ef4444' }}
                        >
                            {totalRejected} invoice{totalRejected !== 1 ? 's' : ''} rejected by
                            customers
                        </Typography.Text>
                        <Typography.Text className="text-[11px]" style={{ color: '#ef4444' }}>
                            These need to be corrected via a GSTR-1A amendment.
                        </Typography.Text>
                    </Flex>
                </Flex>
                <Button
                    type="primary"
                    danger
                    icon={<RightOutlined />}
                    iconPosition="end"
                    style={{ height: 36, fontSize: 13, fontWeight: 500 }}
                    onClick={() => {
                        const rejectedInvs = customers.flatMap(c =>
                            c.invoices.filter(i => i.customerAction === 'R')
                        );
                        const firstRejected = rejectedInvs[0];
                        navigate(`${paths.dashboard.taxMore}/${paths.taxMore.fileGstr1}`, {
                            state: firstRejected
                                ? {
                                      amendInvoice: {
                                          origInvNo: firstRejected.invoiceNo,
                                          origPeriod: formatOrigPeriod(firstRejected.invoiceDate),
                                          receiverGstin: firstRejected.customerGstin,
                                          receiverName: firstRejected.customerName ?? '',
                                          taxableAmount: firstRejected.taxableAmount,
                                          amendTab: invoiceTypeToAmendTab(
                                              firstRejected.invoiceType
                                          ),
                                      },
                                  }
                                : { goToAmendments: true },
                        });
                    }}
                >
                    Go to GSTR-1A
                </Button>
            </Flex>

            <div className="border border-[#cbd5e1] rounded-[20px] overflow-hidden">
                <div className="bg-white px-2 sm:px-6 border-b border-[#e2e8f0]">
                    <Flex gap={0} className="overflow-x-auto">
                        {SUPPLIER_SUB_TABS.map(t => (
                            <button
                                key={t.key}
                                type="button"
                                className="px-4 sm:px-6 py-3 text-sm sm:text-base font-normal transition-colors whitespace-nowrap"
                                style={{
                                    color: activeSubTab === t.key ? '#ff4f4f' : '#1e293b',
                                    borderBottom:
                                        activeSubTab === t.key
                                            ? '2px solid #ff4f4f'
                                            : '2px solid transparent',
                                    marginBottom: -1,
                                }}
                                onClick={() => setActiveSubTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </Flex>
                </div>

                {activeSubTab === 'sales-invoices' && (
                    <div>
                        <div className="px-6 pt-4 pb-3">
                            <div
                                className="flex items-center gap-3 border border-[#e4e4e7] rounded-lg px-4"
                                style={{ height: 40, backgroundColor: 'white' }}
                            >
                                <SearchOutlined style={{ fontSize: 16, color: '#a1a1aa' }} />
                                <input
                                    type="text"
                                    placeholder="Search by invoice no or GSTIN"
                                    value={search}
                                    onChange={e =>
                                        onSearchChange(
                                            e.target.value.replace(
                                                /\p{Extended_Pictographic}/gu,
                                                ''
                                            )
                                        )
                                    }
                                    className="flex-1 outline-none border-none text-sm bg-transparent"
                                    style={{ color: '#1e293b' }}
                                />
                            </div>
                        </div>
                        {renderSalesContent()}
                    </div>
                )}

                {activeSubTab === 'added-back' && (
                    <div>
                        <Flex
                            gap={8}
                            align="center"
                            className="px-4 py-2.5 mx-4 my-3 rounded-lg"
                            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                        >
                            <InfoCircleOutlined
                                style={{ fontSize: 14, color: '#3b82f6', flexShrink: 0 }}
                            />
                            <Typography.Text className="text-xs" style={{ color: '#1e40af' }}>
                                Invoices previously rejected by customers that have been re-added to
                                your outward liability. You still owe GST on these even though the
                                customer won&apos;t claim ITC.
                            </Typography.Text>
                        </Flex>
                        {renderAddedBackContent()}
                    </div>
                )}

                {activeSubTab === 'history' && renderHistoryContent()}
            </div>
        </Flex>
    );
};

export default SupplierView;
