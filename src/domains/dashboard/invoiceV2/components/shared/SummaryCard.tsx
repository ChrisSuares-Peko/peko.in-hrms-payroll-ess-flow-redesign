import { Flex, Typography } from 'antd';

interface SummaryRow {
    label: string;
    value: React.ReactNode;
}

interface SummaryCardProps {
    title: string;
    rows: SummaryRow[];
}

const SummaryCard = ({ title, rows }: SummaryCardProps) => (
    <Flex vertical gap={12} className="border border-[#E2E8F0] rounded-xl px-5 py-4">
        <Typography.Text className="text-base font-semibold">{title}</Typography.Text>
        <Flex vertical gap={8}>
            {rows.map(({ label, value }) => (
                <Flex key={label} justify="space-between" align="center">
                    <Typography.Text className="text-sm text-[#475569]">{label}</Typography.Text>
                    <Typography.Text className="text-sm ">{value}</Typography.Text>
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default SummaryCard;
