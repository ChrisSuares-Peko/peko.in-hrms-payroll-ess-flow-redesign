import { Typography } from 'antd';

const { Text } = Typography;

interface EntityTypeBannerProps {
    entityLabel: string;
}

// "Entity Type" banner — shows the structure picked on the previous screen
// (Figma 1819:22906). Left red accent border.
const EntityTypeBanner = ({ entityLabel }: EntityTypeBannerProps) => (
    <div className="bg-white border-l-[3px] border-[#ff4f4f] rounded-[20px] p-3 sm:p-6 flex flex-col gap-3 drop-shadow-[0px_0px_1px_rgba(0,0,0,0.25)]">
        <div>
            <Text className="!block !text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">
                Entity Type
            </Text>
            <Text className="!text-[14px] !text-[#475569] !leading-[22px]">
                Selected in the previous step
            </Text>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <span className="border border-[#7c3aed] bg-[rgba(124,58,237,0.05)] rounded-[8px] px-4 py-2 text-[16px] text-[#1e293b] leading-[24px]">
                {entityLabel}
            </span>
            <Text className="!text-[14px] !text-[#475569] !leading-[22px]">
                To change this, go back to the previous screen.
            </Text>
        </div>
    </div>
);

export default EntityTypeBanner;
