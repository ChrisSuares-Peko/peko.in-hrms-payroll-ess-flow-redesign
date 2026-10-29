import { Button, Flex } from 'antd';

import { TrendRange, trendRangeOptions } from '../../utils/profitLossData';

interface ChartRangeToggleProps {
    value: TrendRange;
    onChange: (value: TrendRange) => void;
}

const ChartRangeToggle = ({ value, onChange }: ChartRangeToggleProps) => (
    <Flex gap={8} className="shrink-0">
        {trendRangeOptions.map(option => {
            const isActive = option.value === value;
            return (
                <Button
                    key={option.value}
                    size="small"
                    onClick={() => onChange(option.value)}
                    type="default"
                    danger={isActive}
                    className={`!rounded-lg !text-xs !font-medium ${
                        isActive
                            ? '!border-danger !bg-red-50 !text-danger'
                            : '!border-borderStrong !bg-surfaceGray !text-slate-500'
                    }`}
                >
                    {option.label}
                </Button>
            );
        })}
    </Flex>
);

export default ChartRangeToggle;
