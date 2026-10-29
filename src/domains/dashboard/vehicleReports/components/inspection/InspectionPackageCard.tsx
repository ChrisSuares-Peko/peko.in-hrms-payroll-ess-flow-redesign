import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import { InspectionPackage } from '../../types/index';
import FeatureList from '../shared/FeatureList';

const { Text } = Typography;

interface Props {
    pkg: InspectionPackage;
    isSelected: boolean;
    onContinue: () => void;
    onViewSample: () => void;
}

// One inspection package. The "Health Report" teaser has no price and offers
// "Know more" instead of "Continue" (see the Car Reports plan, open question 4).
const InspectionPackageCard = ({ pkg, isSelected, onContinue, onViewSample }: Props) => (
    <Flex
        vertical
        justify="space-between"
        gap={20}
        className={`h-full rounded-2xl border bg-white p-5 shadow-[0px_2px_20px_rgba(0,0,0,0.04)] transition-all ${
            isSelected ? 'border-[#FF4F4F]' : 'border-transparent'
        }`}
    >
        <Flex vertical gap={16}>
            <Text className="text-base font-medium text-[#0A0A0A]">{pkg.name}</Text>
            <FeatureList items={pkg.highlights} variant="outlined" gap={10} />
            {pkg.hasMore && (
                <Button
                    type="link"
                    onClick={onViewSample}
                    className="!h-auto !w-fit !self-end !p-0 !text-xs !text-[#FF4F4F]"
                >
                    See more...
                </Button>
            )}
        </Flex>

        <Flex vertical gap={16}>
            <div className="h-px w-full bg-[#CBD5E1]" />
            <Flex align="end" justify="space-between" gap={12} className="flex-wrap">
                {pkg.isTeaser ? (
                    <Button danger size="large" className="ml-auto" onClick={onViewSample}>
                        Know more
                    </Button>
                ) : (
                    <>
                        <Flex vertical>
                            <Text className="text-xs text-[#98A2B3]">Price</Text>
                            <Text className="text-base font-semibold text-[#0A0A0A]">
                                {`₹${formatNumberWithLocalStringWithoutDecimalPoint(pkg.price)}`}
                            </Text>
                        </Flex>
                        <Flex align="center" gap={12}>
                            <Button
                                type="link"
                                onClick={onViewSample}
                                className="!h-auto !p-0 !text-sm !text-[#FF4F4F]"
                            >
                                View sample
                            </Button>
                            <Button
                                type={isSelected ? 'primary' : 'default'}
                                danger={!isSelected}
                                onClick={onContinue}
                            >
                                Continue <ArrowRightOutlined />
                            </Button>
                        </Flex>
                    </>
                )}
            </Flex>
        </Flex>
    </Flex>
);

export default InspectionPackageCard;
