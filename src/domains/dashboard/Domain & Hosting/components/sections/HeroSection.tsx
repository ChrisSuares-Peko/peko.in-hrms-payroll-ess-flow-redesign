import { Button, Flex, Select, Typography } from 'antd';

import linuxImg from '../../assets/img/linux.png';
import windowsImg from '../../assets/img/windows.png';

const { Text } = Typography;

const OS_TOGGLE_OPTIONS: { value: 'linux' | 'windows'; label: string; img: string }[] = [
    { value: 'linux', label: 'Linux', img: linuxImg },
    { value: 'windows', label: 'Windows', img: windowsImg },
];

interface HeroSectionProps {
    heroBannerTitle: string;
    cheapestPrice: number | undefined | null;
    os: 'linux' | 'windows';
    serverLocation: 'in' | 'us';
    onOsChange: (value: 'linux' | 'windows') => void;
    onLocationChange: (value: 'in' | 'us') => void;
    onLearnMore?: () => void;
    onBuyPlans?: () => void;
    showLocation?: boolean;
    showOsToggle?: boolean;
    heroImage?: string;
}

export const HeroSection = ({
    heroBannerTitle,
    cheapestPrice,
    os,
    serverLocation,
    onOsChange,
    onLocationChange,
    onLearnMore,
    onBuyPlans,
    showLocation = true,
    showOsToggle = true,
    heroImage,
}: HeroSectionProps) => (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        <div
            className="px-6 py-6 lg:px-[60px] lg:py-8 flex flex-col lg:flex-row justify-between items-center gap-8"
            style={{
                background: 'linear-gradient(260.95deg, #F0F5FA 2.04%, #FFF2F2 100.06%)',
                borderRadius: '30px',
            }}
        >
            <div className="flex flex-col gap-5 w-full flex-1">
                <Text className="block capitalize text-[28px] font-semibold leading-normal text-[#1f1f1f] lg:text-[46px]">
                    {heroBannerTitle}
                </Text>
                {cheapestPrice && (
                    <Text className="block text-[14px] text-[#1f1f1f] lg:text-[20px]">
                        As low as{' '}
                        <span className="text-savingsTagLightText">
                            ₹{cheapestPrice}/mo
                        </span>
                    </Text>
                )}
                {onBuyPlans && (
                    <Button onClick={onBuyPlans} size="large" className="self-start bg-lightRed border-lightRed text-white">
                        Buy Now
                    </Button>
                )}
                {onLearnMore && (
                    <Button onClick={onLearnMore} className="self-start bg-lightRed border-lightRed text-white">
                        Learn More
                    </Button>
                )}
            </div>

            {(heroImage || showOsToggle || showLocation) && (
                <Flex
                    vertical
                    gap={16}
                    className="shrink-0 w-full lg:w-auto items-start lg:items-center"
                >
                    {heroImage && (
                        <img
                            src={heroImage}
                            alt=""
                            className="hidden lg:block w-56 xl:w-64 h-auto object-contain"
                        />
                    )}
                    {(showOsToggle || showLocation) && (
                        <Flex
                            align="center"
                            wrap
                            className="w-full gap-3 lg:gap-4 justify-start lg:justify-center"
                        >
                            {showOsToggle && (
                                <div className="flex bg-gray-100 rounded-full p-1.5 gap-1">
                                    {OS_TOGGLE_OPTIONS.map(option => (
                                            <div
                                                key={option.value}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => onOsChange(option.value)}
                                                onKeyDown={e => e.key === 'Enter' && onOsChange(option.value)}
                                                className={`flex items-center gap-2 sm:gap-2.5 rounded-full cursor-pointer transition-all select-none whitespace-nowrap ${
                                                    os === option.value
                                                        ? 'bg-white shadow-sm px-4 sm:px-6 py-2'
                                                        : 'px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-200'
                                                }`}
                                            >
                                                <img
                                                    src={option.img}
                                                    alt={option.label}
                                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                                                />
                                                <Text
                                                    className={`font-medium text-xs sm:text-sm whitespace-nowrap ${
                                                        os === option.value ? 'text-titleText' : 'text-gray-500'
                                                    }`}
                                                >
                                                    {option.label}
                                                </Text>
                                            </div>
                                        ))}
                                </div>
                            )}
                            {showLocation && (
                                <Flex
                                    vertical
                                    gap={4}
                                    className="min-w-[160px] flex-1 sm:flex-none"
                                >
                                    <Text className="text-gray-700 font-medium text-sm">
                                        Server Location
                                    </Text>
                                    <Select
                                        value={serverLocation}
                                        onChange={onLocationChange}
                                        className="w-full"
                                        size="large"
                                    >
                                        <Select.Option value="in">India</Select.Option>
                                        <Select.Option value="us">USA</Select.Option>
                                    </Select>
                                </Flex>
                            )}
                        </Flex>
                    )}
                </Flex>
            )}
        </div>
    </div>
);
