import { Col, Row } from 'antd';

import FeatureCard from './FeatureCard';
import { featureCards } from '../utils/data';

interface FeatureCardGridProps {
    onCardAction?: (key: string) => void;

    statusByKey?: Record<string, string>;
}

const FeatureCardGrid = ({ onCardAction, statusByKey }: FeatureCardGridProps) => (
    <Row gutter={[14, 14]} align="stretch" className="w-full mt-2">
        {featureCards.map(card => (
            <Col key={card.key} xs={24} sm={12} lg={6} className="flex">
                <FeatureCard
                    card={card}
                    statusOverride={statusByKey?.[card.key]}
                    onAction={onCardAction ? () => onCardAction(card.key) : undefined}
                />
            </Col>
        ))}
    </Row>
);

export default FeatureCardGrid;
