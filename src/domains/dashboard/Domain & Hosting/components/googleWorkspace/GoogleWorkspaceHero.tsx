import { Button, Flex, Typography } from 'antd';

import googleWorkspaceImg from '../../assets/img/googleworkspace.png';
import type { HostingPlan } from '../../hooks/useHostingPlans';

const { Text } = Typography;

interface Props {
    plans: HostingPlan[];
    onLearnMore?: () => void;
    onBuyPlans?: () => void;
}

const GoogleWorkspaceHero = ({ plans, onLearnMore, onBuyPlans }: Props) => (
    <div
        className="w-full rounded-[30px] px-6 py-6 lg:px-[60px] lg:py-8 overflow-hidden"
        style={{ background: 'linear-gradient(260.95deg, #F0F5FA 2.04%, #FFF2F2 100.06%)' }}
    >
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <Flex vertical gap={20} className="flex-1 w-full">
            <Flex vertical gap={16}>
                <Typography.Title className="!mb-0 !mt-0 capitalize !text-[28px] !font-semibold !leading-normal !text-[#1f1f1f] lg:!text-[46px]">
                    Google Workspace
                </Typography.Title>
                <Text className="block text-[16px] font-medium leading-[40px] text-[#1f1f1f] lg:text-[24px]">
                    Unleash the power of AI
                </Text>
            </Flex>
            {plans.length > 0 && plans[0].price != null && (
                <Text className="text-[14px] text-[#1f1f1f] lg:text-[20px]">
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
        <img src={googleWorkspaceImg} alt="Google Workspace" className="hidden lg:block w-full max-w-sm h-auto" />
        </div>
    </div>
);

export default GoogleWorkspaceHero;
