import { Col, Flex, Row, Typography } from 'antd';

import { balanceSheetInsights, InsightTile } from '../../utils/balanceSheetData';
import SectionCard from '../profitLoss/SectionCard';

const { Text } = Typography;

interface BalanceSheetInsightsCardProps {
    tiles: InsightTile[];
}

const BalanceSheetInsightsCard = ({ tiles }: BalanceSheetInsightsCardProps) => (
    <SectionCard title={balanceSheetInsights.title}>
        <Row gutter={[16, 16]} className="w-full">
            {tiles.map((tile: InsightTile) => (
                <Col xs={24} md={12} key={tile.key}>
                    <Flex
                        vertical
                        gap={6}
                        className="h-full rounded-[22px] border border-borderStrong p-6"
                    >
                        <Text className="text-base font-medium text-bodyText md:text-lg">
                            {tile.title}
                        </Text>
                        <Text className="text-sm leading-relaxed text-slate-400">{tile.text}</Text>
                    </Flex>
                </Col>
            ))}
        </Row>
    </SectionCard>
);

export default BalanceSheetInsightsCard;
