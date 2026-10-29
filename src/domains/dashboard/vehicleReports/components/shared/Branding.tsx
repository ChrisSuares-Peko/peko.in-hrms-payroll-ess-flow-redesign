import { Flex, Typography } from 'antd';

import DroomLogo from './DroomLogo';

const { Text } = Typography;

interface Props {
    // Height of the droom wordmark in px.
    height?: number;
    classes?: string;
}

// "Partnered with" over the droom wordmark (stacked, per Figma 2876-28970) on the
// vehicle-report screens, which are Droom-backed. The traffic-challan screens keep
// their own copy (challan/components/DroomLogo.tsx) — deliberately, so neither domain
// depends on the other.
const Branding = ({ height = 22, classes = '' }: Props) => (
    <Flex vertical align="end" gap={2} className={`shrink-0 ${classes}`}>
        <Text className="whitespace-nowrap text-[11px] leading-[14px] text-[#486284]">
            Partnered with
        </Text>
        <DroomLogo height={height} />
    </Flex>
);

export default Branding;
