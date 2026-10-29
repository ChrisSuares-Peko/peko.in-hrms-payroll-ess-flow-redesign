import { Button, Flex, Typography } from 'antd';

import { transactionGroups, transactionsHeader } from '../../utils/transactionsData';

const { Title, Text } = Typography;

interface TransactionsHeaderProps {
    onAddViaReceipt?: () => void;
    onImport?: () => void;
    // onInsights?: () => void; // Insights button temporarily hidden
}

const TransactionsHeader = ({ onAddViaReceipt, onImport }: TransactionsHeaderProps) => {
    const latestPeriod = transactionGroups[0]?.month;
    const subtitle = latestPeriod
        ? `${transactionsHeader.subtitle}  ·  ${latestPeriod}`
        : transactionsHeader.subtitle;

    return (
        <Flex
            gap={16}
            wrap="wrap"
            align="flex-start"
            justify="space-between"
            className="flex-col md:flex-row md:items-center"
        >
            <Flex vertical gap={4} className="min-w-0">
                <Title level={3} className="!mb-0 !text-xl !font-semibold !text-ink md:!text-2xl">
                    {transactionsHeader.title}
                </Title>
                <Text className="text-sm text-slate-400 md:text-base">{subtitle}</Text>
            </Flex>

            <Flex gap={12} wrap="wrap" className="shrink-0">
                <Button size="large" onClick={onAddViaReceipt} className="!text-bodyText">
                    Add via Receipt
                </Button>
                <Button size="large" onClick={onImport} className="!text-bodyText">
                    Import
                </Button>
                {/* Insights button temporarily hidden
                <Button size="large" onClick={onInsights} className="!text-bodyText">
                    <span className="inline-flex items-center gap-2">
                        Insights
                        <PieChartOutlined />
                    </span>
                </Button>
                */}
            </Flex>
        </Flex>
    );
};

export default TransactionsHeader;
