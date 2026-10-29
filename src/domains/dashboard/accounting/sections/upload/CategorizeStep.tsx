import { useMemo, useState } from 'react';

import { Button, Flex, Typography } from 'antd';

import DataQualityCard from './DataQualityCard';
import StepFooter from './StepFooter';
import TransactionsTable from './TransactionsTable';
import { ApiTransaction, ParsedStatementQuality } from '../../api/transactions';
import { SampleTransaction } from '../../utils/uploadData';

const { Text } = Typography;

type Tab = 'all' | 'issues';

interface CategorizeStepProps {
    transactions: ApiTransaction[];
    quality: ParsedStatementQuality;
    onContinue: () => void;
    onCancel: () => void;
}

const toRow = (t: ApiTransaction): SampleTransaction => {
    const needsReview = t.statuses?.includes('needs-review');
    return {
        id: String(t.id),
        date: t.date,
        description: t.description,
        category: t.category || '',
        amount: t.type === 'Income' ? t.amount : -t.amount,
        status: needsReview ? 'error' : 'clean',
        note: needsReview ? 'Needs review' : undefined,
    };
};

const CategorizeStep = ({ transactions, quality, onContinue, onCancel }: CategorizeStepProps) => {
    const [tab, setTab] = useState<Tab>('all');

    const rows = useMemo(() => transactions.map(toRow), [transactions]);
    const visible = tab === 'all' ? rows : rows.filter(row => row.status !== 'clean');

    const qualityData = {
        score: quality.score,
        capturedLabel: `${quality.total} transactions captured`,
        counts: { clean: quality.reconciled, warning: 0, error: quality.needsReview },
        aiNote: {
            prefix: 'AI has auto-categorized ',
            highlight: `${quality.categorized} transactions`,
            suffix: '. Review the flagged ones below.',
        },
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'all', label: `All (${quality.total})` },
        { key: 'issues', label: `Issues only (${quality.needsReview})` },
    ];

    return (
        <Flex vertical gap={24} className="w-full">
            <DataQualityCard data={qualityData} />

            <Flex vertical gap={12} className="w-full">
                <Flex gap={12} className="flex-wrap">
                    {tabs.map(item => {
                        const isActive = item.key === tab;
                        return (
                            <Button
                                key={item.key}
                                onClick={() => setTab(item.key)}
                                type={isActive ? 'primary' : 'text'}
                                danger={isActive}
                                className={`!rounded-lg !font-medium ${
                                    isActive ? '' : '!bg-surfaceGray !text-slate-500'
                                }`}
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </Flex>

                <TransactionsTable transactions={visible} />

                <Flex justify="space-between" className="w-full">
                    <Text className="text-xs text-slate-400">
                        Showing {visible.length} of {quality.total} transactions
                    </Text>
                    <Text className="text-xs font-medium text-slate-500">
                        {quality.categorized}/{quality.total} categorized
                    </Text>
                </Flex>
            </Flex>

            <StepFooter
                secondaryLabel="Cancel"
                onSecondary={onCancel}
                primaryLabel="Continue"
                onPrimary={onContinue}
            />
        </Flex>
    );
};

export default CategorizeStep;
