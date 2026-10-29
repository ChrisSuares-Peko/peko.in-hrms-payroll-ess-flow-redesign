import { CheckCircleFilled, CheckOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

interface Props {
    items: string[];
    // 'filled' → solid green circle-tick (landing cards, summary rails).
    // 'outlined' → thin green tick (inset "what this reveals" panels, package cards).
    variant?: 'filled' | 'outlined';
    gap?: number;
    textClasses?: string;
}

// Green-check bullet rows. Appears on every screen in the feature, in two weights.
const FeatureList = ({
    items,
    variant = 'filled',
    gap = 12,
    textClasses = 'text-sm text-[#42526D]',
}: Props) => (
    <Flex vertical gap={gap}>
        {items.map(item => (
            <Flex key={item} align="start" gap={8}>
                {variant === 'filled' ? (
                    <CheckCircleFilled className="shrink-0 text-[20px] text-[#05BE63]" />
                ) : (
                    <CheckOutlined className="mt-[3px] shrink-0 text-xs text-[#0F9D58]" />
                )}
                <Typography.Text className={textClasses}>{item}</Typography.Text>
            </Flex>
        ))}
    </Flex>
);

export default FeatureList;
