import { ArrowRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Grid, Typography } from 'antd';

import { BusinessStructure } from '../utils/data';

const { Text } = Typography;

interface StructureCardProps {
    structure: BusinessStructure;
    onSelect: (structure: BusinessStructure) => void;
}

// One business-structure option (Figma 1746:21366) — all cards render identically.
const StructureCard = ({ structure, onSelect }: StructureCardProps) => {
    const { title, description, timeline, price } = structure;
    // Mobile has no hover tooltip, so wrap the description instead of truncating.
    const screens = Grid.useBreakpoint();

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(structure)}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(structure);
                }
            }}
            className="group bg-white rounded-[24px] p-4 sm:p-6 flex flex-col gap-4 transition-colors duration-200 cursor-pointer border-[0.5px] border-[#ccc] hover:border-[#ff4f4f]"
        >
            <div className="flex flex-col gap-1 min-w-0">
                <Text className="!text-[20px] !font-semibold !text-[#1e293b] !leading-[28px] !block">
                    {title}
                </Text>
                <Text
                    ellipsis={screens.sm ? { tooltip: description } : false}
                    className="!text-[16px] !font-normal !text-[#475569] !leading-[24px] !block"
                >
                    {description}
                </Text>
            </div>

            <div className="flex items-center gap-2 bg-[#f8f8f8] rounded-[90px] px-2 py-2 w-full">
                <ClockCircleOutlined className="text-[#ff4f4f]" style={{ fontSize: 16 }} />
                <Text className="!text-[16px] !text-[#1e293b] !leading-[24px]">{timeline}</Text>
            </div>

            <div className="h-px w-full bg-[#ebebeb]" />

            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <Text className="!text-[22px] !font-semibold !text-[#171717] !leading-none">
                        {price}
                    </Text>
                    <Text className="!text-[10px] !font-normal !text-[#8b8b8b] !leading-none">
                        all-inclusive
                    </Text>
                </div>
                <Button
                    onClick={e => {
                        e.stopPropagation();
                        onSelect(structure);
                    }}
                    className="!h-[40px] !px-4 !text-[14px] !font-medium !rounded-[8px] transition-colors !border-[#ff4f4f] !text-[#ff4f4f] group-hover:!bg-[#ff4f4f] group-hover:!text-white group-hover:!border-[#ff4f4f]"
                >
                    Get Started <ArrowRightOutlined style={{ fontSize: 16 }} />
                </Button>
            </div>
        </div>
    );
};

export default StructureCard;
