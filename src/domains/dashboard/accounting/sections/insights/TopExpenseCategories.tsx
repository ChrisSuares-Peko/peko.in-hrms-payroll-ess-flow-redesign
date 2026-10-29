import { Flex } from 'antd';

import InsightSection from './InsightSection';
import StatBar from './StatBar';
import { AmountBar } from '../../utils/insightsData';

interface TopExpenseCategoriesProps {
    data: { title: string; items: AmountBar[] };
}

const TopExpenseCategories = ({ data }: TopExpenseCategoriesProps) => {
    const max = Math.max(...data.items.map(item => item.amount), 1);

    return (
        <InsightSection title={data.title}>
            <Flex vertical gap={12}>
                {data.items.map(item => (
                    <StatBar
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        percent={(item.amount / max) * 100}
                    />
                ))}
            </Flex>
        </InsightSection>
    );
};

export default TopExpenseCategories;
