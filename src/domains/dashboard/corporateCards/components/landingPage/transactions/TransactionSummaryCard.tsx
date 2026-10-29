import { Empty, Skeleton, Typography } from 'antd';

import { TransactionDetail } from '../../../utils/types';
import InitialsAvatar from '../InitialsAvatar';

const { Text } = Typography;

interface TransactionSummaryCardProps {
    detail: TransactionDetail | null;
    loading?: boolean;
}

/** Left detail summary card on the Transactions detail page: merchant chip, amounts and grouped detail sections. */
const TransactionSummaryCard = ({ detail, loading }: TransactionSummaryCardProps) => {
    if (loading) {
        return (
            <section className="rounded-2xl border border-borderCard bg-white p-5 xl:p-6">
                <Skeleton active paragraph={{ rows: 8 }} />
            </section>
        );
    }

    if (!detail) {
        return (
            <section className="flex items-center justify-center rounded-2xl border border-borderCard bg-white p-5 xl:p-6">
                <Empty description="Transaction details unavailable" />
            </section>
        );
    }

    const d = detail;

    return (
        <section className="flex flex-col gap-5 rounded-2xl border border-borderCard bg-white p-5 xl:p-6">
            <div
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: '#FCF8FF', border: '1px solid #E3BFFF' }}
            >
                {d.logo ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white p-1.5 shadow-sm">
                        <img src={d.logo} alt="" className="h-full w-full object-contain" />
                    </span>
                ) : (
                    <InitialsAvatar name={d.merchantName} tone="neutral" />
                )}
                <div className="flex flex-col">
                    <Text className="text-sm font-semibold text-textHeadings">
                        {d.merchantName}
                    </Text>
                    <Text className="text-xs text-textGreyLight">{d.timestamp}</Text>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Text className="text-sm text-textBody">Transaction amount</Text>
                    <Text className="text-sm text-textHeadings">{d.transactionAmount}</Text>
                </div>
                <div className="flex items-center justify-between">
                    <Text className="text-sm text-textBody">International fee</Text>
                    <Text className="text-sm text-textHeadings">{d.internationalFee}</Text>
                </div>
                <div className="flex items-center justify-between">
                    <Text className="text-sm font-semibold text-textBody">Total charged</Text>
                    <Text className="text-sm font-semibold text-textHeadings">
                        {d.totalCharged}
                    </Text>
                </div>
            </div>

            {d.sections.map(section => (
                <div
                    key={section.title}
                    className="flex flex-col gap-3 border-t border-borderDivider pt-4"
                >
                    <Text className="text-sm font-semibold text-textHeadings">{section.title}</Text>
                    {section.fields.map(field => (
                        <div key={field.label} className="flex items-start justify-between gap-4">
                            <Text className="text-sm text-textBody">{field.label}</Text>
                            <Text className="text-right text-sm text-textHeadings">
                                {field.value}
                            </Text>
                        </div>
                    ))}
                </div>
            ))}
        </section>
    );
};

export default TransactionSummaryCard;
