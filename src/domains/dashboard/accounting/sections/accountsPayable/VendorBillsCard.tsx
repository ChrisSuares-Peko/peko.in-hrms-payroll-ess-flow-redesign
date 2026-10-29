import { Flex, Typography } from 'antd';

import {
    formatRupee,
    billColumns,
    vendorBillsTitle,
    Bill,
    BillStatus,
    BillTotals,
} from '../../utils/accountsPayableData';

const { Title, Text } = Typography;

interface VendorBillsCardProps {
    bills: Bill[];
    totals: BillTotals;
    totalLabel: string;
}

const GRID = 'grid grid-cols-[12rem_repeat(7,minmax(0,1fr))] items-center gap-2 px-4';

const STATUS_PILL: Record<BillStatus, string> = {
    paid: 'bg-success-surface text-success border border-success-border',
    unpaid: 'bg-warning-surface text-warning border border-warning-border',
    partial: 'border border-ink bg-white text-ink',
    overdue: 'bg-danger-surface text-danger border border-danger-border',
};

const STATUS_LABEL: Record<BillStatus, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partial',
    overdue: 'Overdue',
};

const VendorBillsCard = ({ bills, totals, totalLabel }: VendorBillsCardProps) => (
    <Flex vertical gap={16} className="w-full">
        <Title level={4} className="!mb-0 !text-lg !font-semibold !text-ink md:!text-xl">
            {vendorBillsTitle}
        </Title>

        <div className="w-full overflow-x-auto rounded-[22px] border border-borderStrong bg-white [scrollbar-width:thin]">
            <div className="min-w-[64rem]">
                <div className={`${GRID} rounded-t-[22px] bg-surfaceGray py-3.5`}>
                    {billColumns.map((label: string) => (
                        <Text
                            key={label}
                            className="text-xs font-medium uppercase tracking-wide text-slate-400"
                        >
                            {label}
                        </Text>
                    ))}
                </div>

                {bills.map((bill: Bill) => (
                    <div key={bill.billNo} className={`${GRID} border-t border-slate-100 py-3.5`}>
                        <Flex vertical gap={2} className="min-w-0">
                            <Text className="break-words text-sm font-medium text-ink">
                                {bill.vendor}
                            </Text>
                            <Text className="text-xs text-slate-400">{bill.issuedLabel}</Text>
                        </Flex>
                        <Text className="text-sm text-bodyText">{bill.billNo}</Text>
                        <Text className="text-sm text-bodyText">{bill.billDate}</Text>
                        <Text
                            className={`text-sm ${bill.pastDue ? 'text-danger' : 'text-bodyText'}`}
                        >
                            {bill.dueDate}
                        </Text>
                        <Text className="text-sm text-ink">{formatRupee(bill.amount)}</Text>
                        <Text
                            className={`text-sm ${bill.paid > 0 ? 'text-success' : 'text-slate-400'}`}
                        >
                            {bill.paid > 0 ? formatRupee(bill.paid) : '-'}
                        </Text>
                        <Text
                            className={`text-sm ${
                                bill.outstanding > 0 ? 'text-warning' : 'text-slate-400'
                            }`}
                        >
                            {bill.outstanding > 0 ? formatRupee(bill.outstanding) : '-'}
                        </Text>
                        <Flex>
                            <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                                    STATUS_PILL[bill.status]
                                }`}
                            >
                                {STATUS_LABEL[bill.status]}
                            </span>
                        </Flex>
                    </div>
                ))}

                <div className={`${GRID} border-t border-slate-200 py-3.5 font-semibold`}>
                    <Text className="text-sm font-semibold text-ink">{totalLabel}</Text>
                    <Text className="text-sm" />
                    <Text className="text-sm" />
                    <Text className="text-sm" />
                    <Text className="text-sm font-semibold text-ink">
                        {formatRupee(totals.amount)}
                    </Text>
                    <Text className="text-sm font-semibold text-success">
                        {formatRupee(totals.paid)}
                    </Text>
                    <Text className="text-sm font-semibold text-warning">
                        {formatRupee(totals.outstanding)}
                    </Text>
                    <Text className="text-sm" />
                </div>
            </div>
        </div>
    </Flex>
);

export default VendorBillsCard;
