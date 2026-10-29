import { Button, Typography } from 'antd';

import { KYB_LANDING, KYB_LANDING_FEATURES } from '../../../utils/kybData';

const { Title, Text } = Typography;

interface KybLandingProps {
    onGetStarted: () => void;
}

const KybLanding = ({ onGetStarted }: KybLandingProps) => (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-4 pt-1 sm:gap-7 xl:pb-8 xl:pt-2">
        <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
            <span className="rounded-full bg-bgLightPink px-3 py-1 text-xs text-textLightRed sm:px-4 sm:py-1.5 sm:text-sm">
                {KYB_LANDING.badge}
            </span>
            <Title level={2} className="!mb-0 !text-2xl !text-textHeadings sm:!text-3xl">
                {KYB_LANDING.title}
            </Title>
            <Text className="text-sm text-textBody sm:px-8 sm:text-base xl:px-24">
                {KYB_LANDING.description}
            </Text>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-5 xl:gap-7">
            {KYB_LANDING_FEATURES.map(feature => (
                <div
                    key={feature.key}
                    className="relative flex w-full min-h-[15.625rem] flex-col overflow-hidden rounded-2xl bg-bgSkin sm:w-[calc(50%-0.625rem)] sm:rounded-3xl xl:w-[calc(33.333%-1.167rem)]"
                >
                    <div className="flex flex-col gap-1.5 p-4 sm:p-5">
                        <Text className="text-sm font-medium text-textHeadings sm:text-base">
                            {feature.title}
                        </Text>
                        <Text className="text-xs text-textBody sm:text-sm">
                            {feature.description}
                        </Text>
                    </div>
                    {feature.media === 'tiltedCard' ? (
                        <img
                            src={feature.image}
                            alt=""
                            aria-hidden
                            className="absolute right-[14px] top-[119px] w-[167px] -rotate-[7.73deg] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
                        />
                    ) : (
                        <div className="mt-auto flex justify-center px-3 pt-2">
                            <img
                                src={feature.image}
                                alt=""
                                aria-hidden
                                className="h-auto max-w-full object-contain"
                                style={{ width: feature.imageWidth }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>

        <div className="flex flex-col items-center gap-3 sm:gap-4">
            <Text className="text-center text-sm font-medium text-textHeadings sm:text-base">
                {KYB_LANDING.footerNote}
            </Text>
            <Button
                type="primary"
                onClick={onGetStarted}
                className="!h-12 w-full text-sm font-medium sm:!h-14 sm:!w-52 sm:text-base"
            >
                {KYB_LANDING.ctaLabel}
            </Button>
        </div>
    </div>
);

export default KybLanding;
