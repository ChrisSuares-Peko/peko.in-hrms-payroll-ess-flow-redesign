import { Button, Flex, Typography } from 'antd';

import OnboardingSteps from './OnboardingSteps';
import importIcon from '../assets/import.svg';
import { getStartedBanner, onboardingSteps } from '../utils/data';

const { Title, Text } = Typography;

interface GetStartedBannerProps {
    onUpload?: () => void;
}

const GetStartedBanner = ({ onUpload }: GetStartedBannerProps) => (
    <Flex
        gap={20}
        className="flex-col justify-between rounded-2xl border border-borderStrong bg-surfaceGray p-4 sm:p-5 lg:flex-row lg:items-start lg:p-6"
    >
        <Flex gap={12} align="flex-start" className="min-w-0 flex-1">
            <img
                src={importIcon}
                alt=""
                aria-hidden
                className="hidden size-9 shrink-0 sm:block md:size-10"
            />
            <Flex vertical gap={16} className="min-w-0">
                <Flex vertical gap={2}>
                    <Title
                        level={4}
                        className="!mb-0 !text-sm !font-medium !text-bodyText md:!text-base"
                    >
                        {getStartedBanner.title}
                    </Title>
                    <Text className="text-xs text-slate-400">{getStartedBanner.description}</Text>
                </Flex>
                <OnboardingSteps steps={onboardingSteps} currentStep={1} />
            </Flex>
        </Flex>
        <Button type="primary" danger onClick={onUpload} className="w-full shrink-0 lg:w-auto">
            {getStartedBanner.actionLabel}
        </Button>
    </Flex>
);

export default GetStartedBanner;
