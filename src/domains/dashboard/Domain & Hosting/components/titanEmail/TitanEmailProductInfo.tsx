import type { RefObject } from 'react';

import { Button, Flex, Typography } from 'antd';

const { Text, Title } = Typography;

interface Props {
    plansRef?: RefObject<HTMLDivElement>;
    onBuyNow?: () => void;
}

const TitanEmailProductInfo = ({ plansRef, onBuyNow }: Props) => (
    <div className="mt-10 rounded-[20px] border border-[#EEF1F5] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(15,23,42,0.07)] lg:px-[50px] lg:py-[60px]">
        <Flex vertical gap={24} className="lg:gap-[50px]">
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Title level={3} className="!mb-0 !text-[22px] !font-semibold !leading-[38px] !text-[#1e293b] lg:!text-[28px]">
                    Product Info
                </Title>
                <Button
                    className="h-[45px] w-[147px] rounded-[11px] text-[14px] font-semibold lg:w-[187px] lg:text-[16px] bg-lightRed border-lightRed text-white"
                    onClick={() => onBuyNow ? onBuyNow() : plansRef?.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Buy now
                </Button>
            </Flex>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {[
                    { label: 'Product Category', value: 'Email' },
                    { label: 'Product Name', value: 'Titan email' },
                    { label: 'Brand', value: 'ResellerClub' },
                ].map((item, i) => (
                    <Flex key={i} vertical gap={10}>
                        <Text className="text-[15px] font-medium leading-[38px] text-[#1e293b] lg:text-[20px]">{item.label}</Text>
                        <Text className="text-[14px] font-normal leading-[28px] text-[#6f6c8f] lg:text-[20px]">{item.value}</Text>
                    </Flex>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Flex vertical gap={10}>
                    <Text className="text-[15px] font-medium leading-[38px] text-[#1e293b] lg:text-[20px]">Product Description</Text>
                    <Text className="text-[14px] font-normal leading-[28px] text-[#6f6c8f] lg:text-[20px]">
                        All the essentials for looking professional, building trust, and strengthening your brand.
                    </Text>
                </Flex>
                <Flex vertical gap={10}>
                    <Text className="text-[15px] font-medium leading-[38px] text-[#1e293b] lg:text-[20px]">Ideal for</Text>
                    <ul className="list-disc">
                        {['Businesses', 'Digital Marketing Agencies', 'Hosting Companies'].map((item, i) => (
                            <li key={i} className="ms-[30px]">
                                <Text className="text-[14px] font-normal leading-[28px] text-[#6f6c8f] lg:text-[20px]">{item}</Text>
                            </li>
                        ))}
                    </ul>
                </Flex>
            </div>
        </Flex>
    </div>
);

export default TitanEmailProductInfo;
