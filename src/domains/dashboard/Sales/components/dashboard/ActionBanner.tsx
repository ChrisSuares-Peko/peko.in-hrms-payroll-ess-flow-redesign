import { Button, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';

interface ActionBannerProps {
    icon: string;
    label: string;
    buttonLabel: string;
    onClick?: () => void;
}

const ActionBanner = ({ icon, label, buttonLabel, onClick }: ActionBannerProps) => (
    <Flex
        justify="space-between"
        align="center"
        className="bg-[#F8FAFC] rounded-2xl px-6 py-4 flex-wrap gap-3"
    >
        <Flex align="center" gap={16}>
            <ReactSVG src={icon} />
            <TypographyText className="text-[#101828] text-base font-semibold leading-6">
                {label}
            </TypographyText>
        </Flex>
        <Button
            className="h-9 px-5 border-[#FF4F4F] text-[#FF4F4F] font-medium text-sm rounded-lg hover:bg-transparent"
            onClick={onClick}
        >
            {buttonLabel}
        </Button>
    </Flex>
);

export default ActionBanner;
