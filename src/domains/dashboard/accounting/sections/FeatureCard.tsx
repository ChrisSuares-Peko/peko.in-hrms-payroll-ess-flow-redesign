import { Button, Flex, Typography } from 'antd';

import infoCircle from '../assets/info-circle.svg';
import { FeatureCardItem } from '../utils/data';

const { Title, Text } = Typography;

interface FeatureCardProps {
    card: FeatureCardItem;

    statusOverride?: string;
    onAction?: () => void;
}

const FeatureCard = ({ card, statusOverride, onAction }: FeatureCardProps) => {
    const status = statusOverride ?? card.status;
    return (
        <Flex
            vertical
            justify="space-between"
            gap={12}
            className="h-full w-full rounded-2xl bg-white px-4 pb-5 pt-4 shadow-[0px_1.68px_16.79px_1.55px_#0000000F]"
        >
            <Flex vertical gap={12}>
                <Flex
                    align="center"
                    justify="center"
                    className="h-20 w-full rounded-lg bg-[#FFF9F9] sm:aspect-[5/2] sm:h-auto sm:max-h-28"
                >
                    <img
                        src={card.illustration}
                        alt={card.title}
                        className="h-10 w-auto object-contain md:h-11"
                    />
                </Flex>
                <Flex vertical gap={4}>
                    <Title level={5} className="!mb-0 !text-sm !font-medium !text-bodyText">
                        {card.title}
                    </Title>
                    <Text className="text-xs leading-relaxed text-slate-400">
                        {card.description}
                    </Text>
                </Flex>
            </Flex>

            <Flex vertical gap={12}>
                {status && (
                    <Flex
                        align="center"
                        gap={6}
                        className="rounded-lg border border-dashed border-borderStrong bg-surfaceGray px-2.5 py-1.5"
                    >
                        <img src={infoCircle} alt="" aria-hidden className="size-4 shrink-0" />
                        <Text className="text-xs font-medium text-slate-500">{status}</Text>
                    </Flex>
                )}
                <Button
                    type={card.primaryAction ? 'primary' : 'default'}
                    danger
                    onClick={onAction}
                    className="w-full"
                >
                    {card.actionLabel}
                </Button>
            </Flex>
        </Flex>
    );
};

export default FeatureCard;
