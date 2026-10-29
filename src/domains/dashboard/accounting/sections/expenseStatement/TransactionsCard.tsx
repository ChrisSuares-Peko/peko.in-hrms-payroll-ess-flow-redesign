import { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Empty, Flex, Input, Select, Spin, Typography } from 'antd';

import { removeEmoji } from '@src/utils/regex';

import { formatRupee } from '../../utils/reportFormat';

const { Title, Text } = Typography;

export interface ReportTxnRow {
    date: string;
    party: string;
    category: string;
    color: string;
    amount: number;
    reference: string;
}

interface TransactionsCardProps {
    title?: string;

    partyLabel?: string;
    rows?: ReportTxnRow[];
    total?: number;
    loading?: boolean;
}

const GRID = 'grid grid-cols-[7rem_minmax(12rem,1fr)_12rem_9rem_10rem] items-start gap-2 px-4';
const ALL = 'all';

const TransactionsCard = ({
    title = 'Transactions',
    partyLabel = 'Vendor',
    rows = [],
    total = 0,
    loading = false,
}: TransactionsCardProps) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(ALL);

    const categoryOptions = useMemo(() => {
        const unique = [...new Set(rows.map(r => r.category))].sort();
        return [
            { value: ALL, label: 'All categories' },
            ...unique.map(c => ({ value: c, label: c })),
        ];
    }, [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter(
            r =>
                (category === ALL || r.category === category) &&
                (q === '' ||
                    r.party.toLowerCase().includes(q) ||
                    r.category.toLowerCase().includes(q))
        );
    }, [rows, search, category]);

    const filteredTotal = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);
    const columns = ['Date', partyLabel, 'Category', 'Amount', 'Reference'];

    return (
        <Flex vertical gap={16} className="w-full">
            <Title level={4} className="!mb-0 !text-lg !font-semibold !text-ink md:!text-xl">
                {title}
            </Title>

            <Flex gap={12} className="w-full flex-col md:flex-row md:items-center">
                <Input
                    allowClear
                    value={search}
                    onChange={e => setSearch(e.target.value.replace(removeEmoji, ''))}
                    prefix={<SearchOutlined className="text-slate-400" />}
                    placeholder={`Search ${partyLabel.toLowerCase()}, category...`}
                    className="h-11 w-full rounded-lg border-borderStrong md:flex-1"
                />
                <Select
                    value={category}
                    onChange={setCategory}
                    options={categoryOptions}
                    className="h-11 w-full sm:w-auto sm:max-w-[14rem] [&_.ant-select-selector]:!h-11 [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-borderStrong"
                />
            </Flex>

            <div className="w-full overflow-x-auto rounded-[22px] bg-white shadow-[0px_1.68px_16.79px_1.55px_#0000000F] [scrollbar-width:thin]">
                <div className="min-w-[56rem]">
                    <div className={`${GRID} rounded-t-[22px] bg-surfaceGray py-3.5`}>
                        {columns.map(label => (
                            <Text
                                key={label}
                                className="text-xs font-medium uppercase tracking-wide text-slate-400"
                            >
                                {label}
                            </Text>
                        ))}
                    </div>

                    {loading && <Spin className="!flex justify-center py-10" />}

                    {!loading && filtered.length === 0 && (
                        <Empty className="py-10" description="No transactions" />
                    )}

                    {!loading &&
                        filtered.map(txn => (
                            <div
                                key={txn.reference}
                                className={`${GRID} border-t border-slate-100 py-3.5`}
                            >
                                <Text className="whitespace-nowrap text-sm text-bodyText">
                                    {txn.date}
                                </Text>
                                <Text
                                    title={txn.party}
                                    className="line-clamp-2 break-words text-sm font-medium text-ink"
                                >
                                    {txn.party}
                                </Text>
                                <Flex align="flex-start">
                                    <span
                                        className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium"
                                        style={{
                                            color: txn.color,
                                            backgroundColor: `${txn.color}1A`,
                                        }}
                                    >
                                        {txn.category}
                                    </span>
                                </Flex>
                                <Text className="whitespace-nowrap text-sm font-medium text-ink">
                                    {formatRupee(txn.amount)}
                                </Text>
                                <Text className="truncate text-sm text-bodyText">
                                    {txn.reference}
                                </Text>
                            </div>
                        ))}

                    {!loading && filtered.length > 0 && (
                        <div className={`${GRID} border-t border-slate-200 py-3.5`}>
                            <Text className="text-sm font-semibold text-ink">Total</Text>
                            <Text className="text-sm" />
                            <Text className="text-sm" />
                            <Text className="text-sm font-semibold text-ink">
                                {formatRupee(category === ALL ? total : filteredTotal)}
                            </Text>
                            <Text className="text-sm" />
                        </div>
                    )}
                </div>
            </div>
        </Flex>
    );
};

export default TransactionsCard;
