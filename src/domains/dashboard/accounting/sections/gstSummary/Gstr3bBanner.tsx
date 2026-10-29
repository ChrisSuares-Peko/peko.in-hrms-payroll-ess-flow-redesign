import { Flex, Typography } from 'antd';

import { gstr3bBanner } from '../../utils/gstSummaryData';

const { Text } = Typography;

interface Gstr3bBannerProps {
    body: string;
}

const Gstr3bBanner = ({ body }: Gstr3bBannerProps) => (
    <Flex
        vertical
        gap={2}
        className="w-full rounded-lg border border-warning-border bg-warning-surface px-4 py-3"
    >
        <Text className="text-sm font-medium text-amber-600">{gstr3bBanner.title}</Text>
        <Text className="text-xs text-ink md:text-sm">{body}</Text>
    </Flex>
);

export default Gstr3bBanner;
