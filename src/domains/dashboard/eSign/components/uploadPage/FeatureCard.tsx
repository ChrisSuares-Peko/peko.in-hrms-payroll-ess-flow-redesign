import type { FC } from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface FeatureCardProps {
    icon: string;
    text: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ text, icon }) => (
    <Flex gap={10} align="center">
        <Flex justify="center" align="center" className="  p-2 sm:bg-[#FAFAFA] rounded ">
            <ReactSVG src={icon} />
        </Flex>
        <Typography.Paragraph className="text-neutral-600 text-sm font-normal ">
            {text}
        </Typography.Paragraph>
    </Flex>
);
export default FeatureCard;
