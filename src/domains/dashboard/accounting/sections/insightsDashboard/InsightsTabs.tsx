import { Button, Flex } from 'antd';

import { InsightsTabKey, insightsTabs } from '../../utils/insightsDashboardData';

interface InsightsTabsProps {
    active: InsightsTabKey;
    onChange: (key: InsightsTabKey) => void;
}

const InsightsTabs = ({ active, onChange }: InsightsTabsProps) => (
    <Flex wrap="wrap" gap={10}>
        {insightsTabs.map(tab => {
            const isActive = tab.key === active;
            return (
                <Button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`!font-medium ${
                        isActive
                            ? '!border-danger !bg-danger-surface !text-danger'
                            : '!border-borderSubtle !bg-white !text-bodyText'
                    }`}
                >
                    {tab.label}
                </Button>
            );
        })}
    </Flex>
);

export default InsightsTabs;
