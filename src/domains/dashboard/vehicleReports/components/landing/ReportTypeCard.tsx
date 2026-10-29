import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import BestForNote from './BestForNote';
import { ReportTypeCardData } from '../../types/index';
import FeatureList from '../shared/FeatureList';

const { Text, Title } = Typography;

interface Props {
    card: ReportTypeCardData;
    onSelect: () => void;
    onViewSample: () => void;
    // Products with no vendor integration yet are shown but not buyable — see
    // PURCHASABLE_REPORT_TYPES on the landing page.
    isComingSoon?: boolean;
}

// One of the three product cards on the Vehicle Reports landing screen.
const ReportTypeCard = ({ card, onSelect, onViewSample, isComingSoon }: Props) => (
    <Flex
        vertical
        className="h-full rounded-2xl border border-transparent bg-white shadow-[0px_2px_20px_rgba(0,0,0,0.04)] transition-all hover:border-[#FF4F4F]"
    >
        <Flex vertical gap={16} className="p-6">
            <Flex align="center" justify="space-between" gap={10}>
                <Text className="text-base font-medium text-[#0A0A0A]">{card.title}</Text>
                <span
                    className={`shrink-0 rounded-full px-[10px] py-[3px] text-[11px] ${
                        isComingSoon
                            ? 'bg-[#F1F2F4] text-[#667085]'
                            : 'bg-[#FFF1F2] text-[#FF4F4F]'
                    }`}
                >
                    {isComingSoon ? 'Coming soon' : card.badge}
                </span>
            </Flex>

            <Flex vertical>
                {!!card.pricePrefix && (
                    <Text className="text-xs text-[#667085]">{card.pricePrefix}</Text>
                )}
                <Title level={2} className="!mb-0 !text-[34px] !font-semibold !text-[#0A0A0A]">
                    {`₹ ${formatNumberWithLocalStringWithoutDecimalPoint(card.price)}`}
                </Title>
            </Flex>

            <Text className="text-sm text-[#667085]">{card.description}</Text>

            <Button
                type="primary"
                size="large"
                block
                disabled={isComingSoon}
                // Brand red per design; theme primary is #FF3A3A.
                className={isComingSoon ? '' : '!bg-[#FF4F4F] hover:!bg-[#ff6363]'}
                onClick={onSelect}
            >
                {isComingSoon ? 'Coming soon' : card.ctaText}
            </Button>
        </Flex>

        <Divider className="!m-0" />

        <Flex vertical gap={16} className="p-6">
            <Text className="text-base font-medium text-[#0A0A0A]">What&apos;s included</Text>
            <BestForNote text={card.bestFor} />
            <FeatureList items={card.included} />
            <Button
                type="link"
                onClick={onViewSample}
                className="!h-auto !w-fit !p-0 !text-sm !text-[#FF4F4F]"
            >
                View sample <ArrowRightOutlined />
            </Button>
        </Flex>
    </Flex>
);

export default ReportTypeCard;
