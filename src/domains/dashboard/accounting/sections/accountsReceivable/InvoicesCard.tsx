import { Flex, Typography } from 'antd';

import {
    formatRupee,
    invoiceColumns,
    Invoice,
    InvoiceStatus,
    InvoiceTotals,
} from '../../utils/accountsReceivableData';

const { Title, Text } = Typography;

const GRID = 'grid grid-cols-[12rem_repeat(7,minmax(0,1fr))] items-center gap-2 px-4';

const STATUS_PILL: Record<InvoiceStatus, string> = {
    paid: 'bg-success-surface text-success border border-success-border',
    unpaid: 'bg-warning-surface text-warning border border-warning-border',
    partial: 'border border-ink bg-white text-ink',
    overdue: 'bg-danger-surface text-danger border border-danger-border',
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    overdue: 'Overdue',
};

interface InvoicesCardProps {
    data: { invoices: Invoice[]; totals: InvoiceTotals; totalLabel: string };
}

const InvoicesCard = ({ data }: InvoicesCardProps) => (
    <Flex vertical gap={16} className="w-full">
        <Title level={4} className="!mb-0 !text-lg !font-semibold !text-ink md:!text-xl">
            Invoices
        </Title>

        <div className="w-full overflow-x-auto rounded-[22px] bg-white shadow-[0px_1.68px_16.79px_1.55px_#0000000F] [scrollbar-width:thin]">
            <div className="min-w-[64rem]">
                <div className={`${GRID} rounded-t-[22px] bg-surfaceGray py-3.5`}>
                    {invoiceColumns.map((label: string) => (
                        <Text
                            key={label}
                            className="text-xs font-medium uppercase tracking-wide text-slate-400"
                        >
                            {label}
                        </Text>
                    ))}
                </div>

                {data.invoices.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">No invoices</div>
                )}

                {data.invoices.map((inv: Invoice) => (
                    <div key={inv.invoiceNo} className={`${GRID} border-t border-slate-100 py-3.5`}>
                        <Flex vertical gap={2} className="min-w-0">
                            <Text className="break-words text-sm font-medium text-ink">
                                {inv.customer}
                            </Text>
                            <Text className="text-xs text-slate-400">{inv.issuedLabel}</Text>
                        </Flex>
                        <Text className="text-sm text-bodyText">{inv.invoiceNo}</Text>
                        <Text className="text-sm text-bodyText">{inv.invoiceDate}</Text>
                        <Text
                            className={`text-sm ${inv.pastDue ? 'text-danger' : 'text-bodyText'}`}
                        >
                            {inv.dueDate}
                        </Text>
                        <Text className="text-sm text-ink">{formatRupee(inv.amount)}</Text>
                        <Text
                            className={`text-sm ${inv.paid > 0 ? 'text-success' : 'text-slate-400'}`}
                        >
                            {inv.paid > 0 ? formatRupee(inv.paid) : '-'}
                        </Text>
                        <Text
                            className={`text-sm ${
                                inv.outstanding > 0 ? 'text-warning' : 'text-slate-400'
                            }`}
                        >
                            {inv.outstanding > 0 ? formatRupee(inv.outstanding) : '-'}
                        </Text>
                        <Flex>
                            <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                                    STATUS_PILL[inv.status]
                                }`}
                            >
                                {STATUS_LABEL[inv.status]}
                            </span>
                        </Flex>
                    </div>
                ))}

                <div className={`${GRID} border-t border-slate-200 py-3.5 font-semibold`}>
                    <Text className="text-sm font-semibold text-ink">{data.totalLabel}</Text>
                    <Text className="text-sm" />
                    <Text className="text-sm" />
                    <Text className="text-sm" />
                    <Text className="text-sm font-semibold text-ink">
                        {formatRupee(data.totals.amount)}
                    </Text>
                    <Text className="text-sm font-semibold text-success">
                        {formatRupee(data.totals.paid)}
                    </Text>
                    <Text className="text-sm font-semibold text-warning">
                        {formatRupee(data.totals.outstanding)}
                    </Text>
                    <Text className="text-sm" />
                </div>
            </div>
        </div>
    </Flex>
);

export default InvoicesCard;
