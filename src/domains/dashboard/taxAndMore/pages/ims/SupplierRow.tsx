import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

import CountBadge from './CountBadge';
import { fmt, getFlagBg, getFlagColor } from './imsUtils';
import InvoiceTable from './InvoiceTable';
import { ImsInvoiceStatus, ImsSupplier } from '../../types';

const SupplierRow = ({
    supplier,
    expanded,
    invoiceStatuses,
    actioningId,
    onToggle,
    onAction,
}: {
    supplier: ImsSupplier;
    expanded: boolean;
    invoiceStatuses: Record<string, ImsInvoiceStatus>;
    actioningId: string | null;
    onToggle: () => void;
    onAction: (invId: string, s: ImsInvoiceStatus) => void;
}) => (
    <div className="border-b border-[#cbd5e1] last:border-b-0">
        <button
            type="button"
            className="w-full text-left px-4 sm:px-6 hover:bg-[#fafafa] transition-colors"
            onClick={onToggle}
        >
            <div className="py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                {/* Name + GSTIN */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                        <Typography.Text
                            className="font-semibold"
                            style={{ fontSize: 16, color: '#1e293b' }}
                        >
                            {supplier.name}
                        </Typography.Text>
                        {supplier.flags.map(f => (
                            <span
                                key={f}
                                style={{
                                    backgroundColor: getFlagBg(f),
                                    color: getFlagColor(f),
                                    borderRadius: 60,
                                    padding: '2px 8px',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                    <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                        {supplier.gstin}
                    </Typography.Text>
                </div>

                {/* Badges + amount + chevron */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    <CountBadge count={supplier.accepted} status="accepted" />
                    <CountBadge count={supplier.pending} status="pending" />
                    <CountBadge count={supplier.rejected} status="rejected" />
                    <Typography.Text
                        className="text-sm sm:text-base whitespace-nowrap"
                        style={{ color: '#1e293b' }}
                    >
                        ₹ {fmt(supplier.total)}
                    </Typography.Text>
                    {expanded ? (
                        <UpOutlined style={{ fontSize: 16, color: '#475569' }} />
                    ) : (
                        <DownOutlined style={{ fontSize: 16, color: '#475569' }} />
                    )}
                </div>
            </div>
        </button>

        {expanded && (
            <InvoiceTable
                invoices={supplier.invoices}
                statuses={invoiceStatuses}
                actioningId={actioningId}
                onAction={onAction}
            />
        )}
    </div>
);

export default SupplierRow;
