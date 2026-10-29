import { Button, Flex } from 'antd';

import { TransactionTab, transactionTabs } from '../../utils/transactionsData';

interface TransactionFilterTabsProps {
    activeTab: TransactionTab['key'];
    onChange: (key: TransactionTab['key']) => void;

    counts: Partial<Record<TransactionTab['key'], number>>;
}

const TransactionFilterTabs = ({ activeTab, onChange, counts }: TransactionFilterTabsProps) => (
    <Flex wrap="wrap" gap={8}>
        {transactionTabs.map(tab => {
            const isActive = tab.key === activeTab;
            return (
                <Button
                    key={tab.key}
                    shape="round"
                    type={isActive ? 'primary' : 'text'}
                    danger={isActive}
                    onClick={() => onChange(tab.key)}
                    className={
                        isActive
                            ? '!font-medium'
                            : '!font-medium !text-muted hover:!bg-slate-100 hover:!text-bodyText'
                    }
                >
                    {tab.label} ({counts[tab.key] ?? 0})
                </Button>
            );
        })}
    </Flex>
);

export default TransactionFilterTabs;
