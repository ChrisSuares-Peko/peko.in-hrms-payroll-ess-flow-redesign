import { Flex, Typography } from 'antd';

interface UpiCollectHowItWorksProps {
    items: string[];
}

const UpiCollectHowItWorks = ({ items }: UpiCollectHowItWorksProps) => (
    <div className="rounded-xl p-4" style={{ background: '#F8FAFC' }}>
        <Flex vertical gap={12}>
            <Flex align="center" gap={8}>
                <span style={{ fontSize: 18 }}>💡</span>
                <Typography.Text className="font-bold text-base">How UPI Collect works</Typography.Text>
            </Flex>
            <Flex vertical gap={8}>
                {items.map(item => (
                    <Typography.Text key={item} className="text-sm text-gray-600">
                        {'• '}
                        {item}
                    </Typography.Text>
                ))}
            </Flex>
        </Flex>
    </div>
);

export default UpiCollectHowItWorks;
