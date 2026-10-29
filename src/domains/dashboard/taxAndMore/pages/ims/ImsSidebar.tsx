import { RightOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';

import { fmt } from './imsUtils';
import { ItcEstimate } from '../../types';

export interface SupplierSummary {
    totalInvoices: number;
    totalTaxable: number;
    totalTax: number;
    accepted: number;
    rejected: number;
    noResponse: number;
}

interface ImsSidebarProps {
    activeMainTab: 'recipient' | 'supplier';
    isLoading: boolean;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    itcEstimate: ItcEstimate | null;
    supplierSummary: SupplierSummary | null;
    pendingCount: number;
    onSave: () => void;
    onGoToGstr2b: () => void;
    onGoToGstr1a: () => void;
}

const ImsSidebar = ({
    activeMainTab,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    itcEstimate,
    supplierSummary,
    pendingCount,
    onSave,
    onGoToGstr2b,
    onGoToGstr1a,
}: ImsSidebarProps) => (
    <Flex vertical gap={12}>
        <Flex
            vertical
            gap={12}
            align="center"
            className="bg-white border border-[#cbd5e1] rounded-[14px] px-6 py-5"
        >
            {!hasUnsavedChanges && (
                <Typography.Text className="text-sm text-center" style={{ color: '#64748b' }}>
                    All changes saved
                </Typography.Text>
            )}
            <Button
                block
                loading={isSaving}
                disabled={!hasUnsavedChanges}
                onClick={onSave}
                style={{ height: 48, fontSize: 14 }}
            >
                Save Changes
            </Button>
        </Flex>

        {activeMainTab === 'recipient' && (
            <Flex
                vertical
                gap={16}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-6 py-5"
            >
                <Typography.Text
                    className="font-semibold"
                    style={{ fontSize: 16, color: '#1e293b' }}
                >
                    ITC Estimate
                </Typography.Text>
                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                    <Flex vertical gap={14}>
                        {[
                            {
                                label: 'Accepted',
                                value: `₹${fmt(itcEstimate?.accepted ?? 0)}`,
                                color: '#43b75d',
                            },
                            {
                                label: 'Pending',
                                value: `₹${fmt(itcEstimate?.pending ?? 0)}`,
                                color: '#f59e0b',
                            },
                            {
                                label: 'Rejected',
                                value: `−₹${fmt(itcEstimate?.rejected ?? 0)}`,
                                color: '#ef4444',
                            },
                        ].map(row => (
                            <Flex key={row.label} align="center" justify="space-between">
                                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                    {row.label}
                                </Typography.Text>
                                <Typography.Text className="text-sm" style={{ color: row.color }}>
                                    {row.value}
                                </Typography.Text>
                            </Flex>
                        ))}
                        <div className="border-t border-[#e2e8f0] pt-3">
                            <Flex align="center" justify="space-between">
                                <Typography.Text
                                    className="font-semibold"
                                    style={{ fontSize: 16, color: '#1e293b' }}
                                >
                                    Net claimable
                                </Typography.Text>
                                <Typography.Text
                                    className="font-semibold"
                                    style={{ fontSize: 16, color: '#43b75d' }}
                                >
                                    ₹{fmt(itcEstimate?.netClaimable ?? 0)}
                                </Typography.Text>
                            </Flex>
                        </div>
                    </Flex>
                )}
            </Flex>
        )}

        {activeMainTab === 'supplier' && (
            <Flex
                vertical
                gap={16}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-6 py-5"
            >
                <Typography.Text
                    className="font-semibold"
                    style={{ fontSize: 16, color: '#1e293b' }}
                >
                    Sales Summary
                </Typography.Text>
                {isLoading ? (
                    <Skeleton active paragraph={{ rows: 5 }} />
                ) : (
                    <Flex vertical gap={14}>
                        {[
                            {
                                label: 'Total invoices',
                                value: String(supplierSummary?.totalInvoices ?? 0),
                                color: '#1e293b',
                            },
                            {
                                label: 'Total taxable',
                                value: `₹${fmt(supplierSummary?.totalTaxable ?? 0)}`,
                                color: '#1e293b',
                            },
                            {
                                label: 'Total tax',
                                value: `₹${fmt(supplierSummary?.totalTax ?? 0)}`,
                                color: '#1e293b',
                            },
                        ].map(row => (
                            <Flex key={row.label} align="center" justify="space-between">
                                <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                                    {row.label}
                                </Typography.Text>
                                <Typography.Text
                                    className="text-sm font-medium"
                                    style={{ color: row.color }}
                                >
                                    {row.value}
                                </Typography.Text>
                            </Flex>
                        ))}
                        <div className="border-t border-[#e2e8f0] pt-3">
                            <Flex vertical gap={10}>
                                {[
                                    {
                                        label: 'Accepted',
                                        value: `${supplierSummary?.accepted ?? 0} invoices`,
                                        color: '#43b75d',
                                    },
                                    {
                                        label: 'Rejected',
                                        value: `${supplierSummary?.rejected ?? 0} invoices`,
                                        color: '#ef4444',
                                    },
                                    {
                                        label: 'No response',
                                        value: `${supplierSummary?.noResponse ?? 0} invoices`,
                                        color: '#94a3b8',
                                    },
                                ].map(row => (
                                    <Flex key={row.label} align="center" justify="space-between">
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: '#475569' }}
                                        >
                                            {row.label}
                                        </Typography.Text>
                                        <Typography.Text
                                            className="text-sm"
                                            style={{ color: row.color }}
                                        >
                                            {row.value}
                                        </Typography.Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </div>
                    </Flex>
                )}
            </Flex>
        )}

        {activeMainTab === 'recipient' ? (
            <Flex
                vertical
                gap={16}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-6 py-5"
            >
                <Typography.Text
                    className="text-sm"
                    style={{ color: '#1e293b', lineHeight: '22px' }}
                >
                    {pendingCount > 0 ? (
                        <>
                            <span className="font-semibold">{pendingCount} invoices</span> not
                            reviewed — will be auto-accepted.
                        </>
                    ) : (
                        'All invoices reviewed.'
                    )}
                </Typography.Text>
                <Button
                    type="primary"
                    danger
                    block
                    icon={<RightOutlined />}
                    iconPosition="end"
                    style={{ height: 48, fontSize: 14 }}
                    onClick={onGoToGstr2b}
                >
                    Go to GSTR-2B
                </Button>
            </Flex>
        ) : (
            <Flex
                vertical
                gap={16}
                className="bg-white border border-[#cbd5e1] rounded-[14px] px-6 py-5"
            >
                <Typography.Text
                    className="text-sm"
                    style={{ color: '#1e293b', lineHeight: '22px' }}
                >
                    Supplier view is read-only. To correct a rejected invoice, file a GSTR-1A
                    amendment.
                </Typography.Text>
                <Button
                    type="primary"
                    danger
                    block
                    style={{ height: 48, fontSize: 14 }}
                    onClick={onGoToGstr1a}
                >
                    File GSTR-1A
                </Button>
            </Flex>
        )}
    </Flex>
);

export default ImsSidebar;
