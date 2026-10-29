import { Button, Flex, Typography } from 'antd';

import titanEmailImg from '../../assets/img/titanemail.png';
import type { HostingPlan } from '../../hooks/useHostingPlans';

const { Text, Title } = Typography;

interface Props {
    plans?: HostingPlan[];
    onLearnMore?: () => void;
    onBuyPlans?: () => void;
}

const TitanEmailHero = ({ plans, onLearnMore, onBuyPlans }: Props) => (
    <div
        className="mb-10 rounded-[30px] px-6 py-6 lg:px-[60px] lg:py-8"
        style={{ background: 'linear-gradient(264.69deg, rgb(240, 245, 250) 2.04%, rgb(255, 242, 242) 100.06%)' }}
    >
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <Flex vertical gap={16} className="flex-1 w-full">
                <Flex vertical gap={8}>
                    <Title level={2} className="!mb-0 capitalize !text-[22px] !font-semibold !leading-normal !text-[#1f1f1f] lg:!text-[36px]">
                        Titan Email
                    </Title>
                    <Text className="block text-[14px] font-medium text-[#1f1f1f] lg:text-[18px]">
                        All the essentials for looking professional, building trust, and strengthening your brand.
                    </Text>
                </Flex>
                {plans && plans.length > 0 && plans[0].price != null && (
                    <Text className="text-[14px] text-[#1f1f1f] lg:text-[18px]">
                        As low as{' '}
                        <span className="text-savingsTagLightText">₹{plans[0].price}/mo</span>
                    </Text>
                )}
                {onBuyPlans && (
                    <Button size="large" onClick={onBuyPlans} className="self-start bg-lightRed border-lightRed text-white">
                        Buy Now
                    </Button>
                )}
                {onLearnMore && (
                    <Button onClick={onLearnMore} className="self-start bg-lightRed border-lightRed text-white">
                        Learn More
                    </Button>
                )}
            </Flex>
            <img src={titanEmailImg} alt="Titan Email" className="hidden lg:block w-48 h-auto shrink-0" />
        </div>
    </div>
);

export default TitanEmailHero;
