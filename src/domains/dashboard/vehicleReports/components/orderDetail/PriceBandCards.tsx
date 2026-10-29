import { Col, Flex, Row, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PriceBand } from '../../types/index';

const { Text } = Typography;

// Tint per condition grade, matching the valuation result design.
const gradeTints: Record<string, string> = {
    Excellent: 'bg-[#FDF3D7] text-[#8A6100]',
    'Very good': 'bg-[#DFF3E4] text-[#0F6B37]',
    Good: 'bg-[#EDE3FB] text-[#5B34A6]',
    Fair: 'bg-[#F1F2F4] text-[#475569]',
};

interface Props {
    bands: PriceBand[];
}

// The four fair-market-value bands on a completed valuation report.
const PriceBandCards = ({ bands }: Props) => (
    <Row gutter={[16, 16]}>
        {bands.map(band => (
            <Col key={band.grade} xs={24} sm={12} xl={6}>
                <Flex
                    vertical
                    gap={12}
                    className="h-full rounded-xl bg-white p-4 shadow-[0px_2px_20px_rgba(0,0,0,0.04)]"
                >
                    <span
                        className={`w-fit rounded-full px-[10px] py-[3px] text-xs ${
                            gradeTints[band.grade] ?? gradeTints.Fair
                        }`}
                    >
                        {band.grade}
                    </span>
                    {/* formatNumberWithLocalString already emits two decimals. */}
                    <Text className="text-sm text-[#42526D]">
                        {`₹ ${formatNumberWithLocalString(band.min)}`}
                        <span className="font-medium"> to </span>
                        {`₹ ${formatNumberWithLocalString(band.max)}`}
                    </Text>
                </Flex>
            </Col>
        ))}
    </Row>
);

export default PriceBandCards;
