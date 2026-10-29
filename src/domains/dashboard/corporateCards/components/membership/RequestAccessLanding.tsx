import { Button, Typography } from 'antd';

import { CardArtwork, CompanyFundingArt, FeatureTile, SpendTrackingArt } from './requestAccess';
import {
    REQUEST_ACCESS_FEATURES,
    REQUEST_ACCESS_INTRO,
    RequestAccessMedia,
} from '../../utils/membershipData';

const { Title, Text } = Typography;

const MEDIA: Record<RequestAccessMedia, () => JSX.Element> = {
    card: CardArtwork,
    tracking: SpendTrackingArt,
    funding: CompanyFundingArt,
};

interface RequestAccessLandingProps {
    onRequest: () => void;
    loading?: boolean;
}

/** What an employee sees before they have asked for Corporate Cards access. */
const RequestAccessLanding = ({ onRequest, loading }: RequestAccessLandingProps) => (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 py-4 text-center sm:gap-6 xl:gap-7 xl:py-8">
        <span className="rounded-full bg-bgLightPink px-4 py-2 text-sm text-textLightRed xl:px-5 xl:text-base">
            {REQUEST_ACCESS_INTRO.badge}
        </span>

        <Title
            level={1}
            className="!mb-0 !text-2xl !font-bold !text-textHeadings sm:!text-3xl xl:!text-4xl"
        >
            {REQUEST_ACCESS_INTRO.title}
        </Title>

        <Text className="max-w-3xl text-sm text-black sm:text-base xl:max-w-4xl xl:text-lg">
            {REQUEST_ACCESS_INTRO.description}
        </Text>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-5 text-left sm:grid-cols-2 lg:grid-cols-3 xl:gap-7">
            {REQUEST_ACCESS_FEATURES.map(feature => {
                const Media = MEDIA[feature.media];
                return (
                    <FeatureTile
                        key={feature.key}
                        title={feature.title}
                        description={feature.description}
                    >
                        <Media />
                    </FeatureTile>
                );
            })}
        </div>

        <Text className="text-sm font-medium text-black sm:text-base xl:text-lg">
            {REQUEST_ACCESS_INTRO.footnote}
        </Text>

        <Button
            type="primary"
            onClick={onRequest}
            loading={loading}
            className="!h-12 w-full max-w-xs text-sm font-medium sm:!w-52 sm:text-base xl:!h-14"
        >
            {REQUEST_ACCESS_INTRO.ctaLabel}
        </Button>
    </div>
);

export default RequestAccessLanding;
