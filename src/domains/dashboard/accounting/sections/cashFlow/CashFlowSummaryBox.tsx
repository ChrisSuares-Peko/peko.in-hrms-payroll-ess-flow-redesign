import { Flex, Typography } from 'antd';

import { formatMoney } from './cashFlowStatement.constants';
import { CashFlowSummaryBoxData } from '../../utils/cashFlowViewModel';

const { Text } = Typography;

const CashFlowSummaryBox = ({ rows, closing }: CashFlowSummaryBoxData) => (
    <Flex vertical gap={6} className="rounded-xl border border-borderStrong p-3">
        {rows.map(row => (
            <Flex key={row.label} justify="space-between" className="py-1.5">
                <Text className="min-w-0 break-words text-sm text-slate-500">{row.label}</Text>
                <Text className="shrink-0 whitespace-nowrap pl-2 text-sm text-bodyText">
                    {formatMoney(row.amount)}
                </Text>
            </Flex>
        ))}

        <Flex
            justify="space-between"
            className="rounded-lg border border-success-border bg-success-surface px-3 py-2"
        >
            <Text className="min-w-0 break-words font-semibold text-ink">{closing.label}</Text>
            <Text className="shrink-0 whitespace-nowrap pl-2 font-semibold text-success">
                {formatMoney(closing.amount)}
            </Text>
        </Flex>
    </Flex>
);

export default CashFlowSummaryBox;
