import { Typography } from 'antd';

import StandardPersonFields from '../StandardPersonFields';

const { Text } = Typography;

interface DirectorCardProps {
    index: number;
    namePrefix?: string;
    // Card heading — "Proprietor" for the sole-owner entity.
    label?: string;
    indianOnly?: boolean;
}

// Director/proprietor identity card (Figma 1808:21171).
const DirectorCard = ({
    index,
    namePrefix = 'director',
    label = 'Director',
    indianOnly = false,
}: DirectorCardProps) => (
    <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <Text className="!text-[16px] !font-semibold !text-[#1e293b]">{label}</Text>
            <span className="bg-[#fff3f3] text-[#ff4f4f] text-[14px] rounded-full px-[7px] leading-[22px]">
                {index}
            </span>
        </div>
        <StandardPersonFields namePrefix={namePrefix} indianOnly={indianOnly} />
    </div>
);

export default DirectorCard;
