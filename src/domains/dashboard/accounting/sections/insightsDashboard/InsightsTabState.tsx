import { Empty, Flex, Spin } from 'antd';

interface InsightsTabStateProps {
    loading: boolean;
    emptyLabel: string;
}

// Placeholder for a tab (or tab section) that is still loading or has no data.
const InsightsTabState = ({ loading, emptyLabel }: InsightsTabStateProps) => (
    <Flex align="center" justify="center" className="min-h-[300px]">
        {loading ? <Spin /> : <Empty description={emptyLabel} />}
    </Flex>
);

export default InsightsTabState;
