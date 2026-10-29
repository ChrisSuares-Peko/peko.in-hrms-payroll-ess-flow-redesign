import { Flex, Typography } from 'antd';

import getVehicleImage from '../../../turbo/utils/getVehicleImage';

interface Props {
    modelName: string;
    bodyType?: string;
    // Optional `2018 | 76,000 km | Jaipur` line beneath the model name.
    meta?: string[];
}

// Centred vehicle image with the model name sitting on a horizontal rule.
// Heads the valuation and history result cards.
const VehicleHeroStrip = ({ modelName, bodyType, meta }: Props) => (
    <Flex vertical align="center" gap={4}>
        <img
            src={getVehicleImage(bodyType)}
            alt=""
            className="h-[86px] w-[150px] object-contain"
        />
        <Flex align="center" gap={16} className="w-full">
            <span className="h-px flex-1 bg-[#E4E7EC]" />
            <Typography.Text className="text-base font-medium text-[#0A0A0A]">
                {modelName}
            </Typography.Text>
            <span className="h-px flex-1 bg-[#E4E7EC]" />
        </Flex>
        {!!meta?.length && (
            <Typography.Text className="text-xs text-[#98A2B3]">
                {meta.join('  |  ')}
            </Typography.Text>
        )}
    </Flex>
);

export default VehicleHeroStrip;
