import { useState } from 'react';

import { WarningFilled } from '@ant-design/icons';
import { Flex, Select, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { categorize, SampleTransaction, transactionCategories } from '../../utils/uploadData';

const { Text } = Typography;

const GRID = 'grid grid-cols-[4.5rem_minmax(8rem,1fr)_11rem_8rem] items-center gap-x-6';
const UNCATEGORIZED = 'uncategorized';

interface TransactionsTableProps {
    transactions: SampleTransaction[];
}

const amountSign = (amount: number) => {
    if (amount > 0) return '+';
    if (amount < 0) return '−';
    return '';
};

const amountColor = (amount: number) => {
    if (amount > 0) return '#43B75D';
    if (amount < 0) return '#FF3A3A';
    return '#888F98';
};

const formatAmount = (amount: number) =>
    `${amountSign(amount)}${categorize.currencySymbol}${formatNumberWithLocalString(Math.abs(amount))}`;

const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
    const [categories, setCategories] = useState<Record<string, string>>(() =>
        Object.fromEntries(transactions.map(txn => [txn.id, txn.category || UNCATEGORIZED]))
    );

    return (
        <div className="w-full overflow-x-auto rounded-[22px] border border-borderStrong">
            <div className="min-w-[42rem]">
                <div className={`${GRID} bg-surfaceGray px-6 py-3`}>
                    {categorize.columns.map((column, index) => (
                        <Text
                            key={column}
                            className={`text-sm font-medium text-slate-400 ${
                                index === categorize.columns.length - 1 ? 'text-right' : ''
                            }`}
                        >
                            {column}
                        </Text>
                    ))}
                </div>

                {transactions.map((txn, index) => {
                    const value = categories[txn.id] ?? UNCATEGORIZED;
                    const isUncategorized = value === UNCATEGORIZED;

                    return (
                        <div
                            key={txn.id}
                            className={`${GRID} px-6 py-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                        >
                            <Text className="whitespace-nowrap text-sm text-slate-400">
                                {txn.date}
                            </Text>

                            <Flex vertical gap={6} className="min-w-0">
                                <Text className="text-sm font-medium text-slate-500">
                                    {txn.description}
                                </Text>
                                {txn.note && (
                                    <Flex align="center" gap={6}>
                                        <WarningFilled className="text-xs text-warning" />
                                        <Text className="text-xs font-medium text-warning">
                                            {txn.note}
                                        </Text>
                                    </Flex>
                                )}
                            </Flex>

                            <Select
                                value={value}
                                variant="filled"
                                options={transactionCategories}
                                onChange={next =>
                                    setCategories(prev => ({ ...prev, [txn.id]: next }))
                                }
                                className={`w-full [&_.ant-select-selector]:!rounded-lg ${
                                    isUncategorized
                                        ? '[&_.ant-select-selection-item]:!text-danger [&_.ant-select-selector]:!bg-danger-surface'
                                        : '[&_.ant-select-selection-item]:!text-slate-500 [&_.ant-select-selector]:!bg-surfaceGray'
                                }`}
                            />

                            <Text
                                className="whitespace-nowrap text-right text-sm font-medium"
                                style={{ color: amountColor(txn.amount) }}
                            >
                                {formatAmount(txn.amount)}
                            </Text>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TransactionsTable;
