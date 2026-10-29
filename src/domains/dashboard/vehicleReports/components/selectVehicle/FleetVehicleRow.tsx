import { ArrowRightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import getVehicleImage from '../../../turbo/utils/getVehicleImage';
import { SelectedVehicle } from '../../types/index';

const { Text } = Typography;

interface Props {
    vehicle: SelectedVehicle;
    isSelected: boolean;
    onSelect: () => void;
}

// One selectable row inside the "Select from your fleet" card.
const FleetVehicleRow = ({ vehicle, isSelected, onSelect }: Props) => {
    const descriptor = [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' · ');

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
            }}
            className={`cursor-pointer rounded-xl border bg-white p-3 shadow-[0px_2px_20px_rgba(0,0,0,0.04)] transition-all ${
                isSelected ? 'border-[#FF4F4F]' : 'border-transparent hover:border-[#D0D5DD]'
            }`}
        >
            <Flex align="center" justify="space-between" gap={12}>
                <Flex align="center" gap={14} className="min-w-0">
                    <div className="flex h-[52px] w-[64px] shrink-0 items-center justify-center rounded-lg bg-[#F5F6F8]">
                        <img
                            src={getVehicleImage(vehicle.bodyType)}
                            alt=""
                            className="h-[34px] w-[52px] object-contain"
                        />
                    </div>
                    <Flex vertical gap={4} className="min-w-0">
                        <Text className="text-base font-medium text-[#0A0A0A]">
                            {vehicle.vehicleNumber}
                        </Text>
                        {!!descriptor && (
                            <Text className="truncate text-xs uppercase text-[#98A2B3]">
                                {descriptor}
                            </Text>
                        )}
                    </Flex>
                </Flex>
                <ArrowRightOutlined className="shrink-0 text-[#42526D]" />
            </Flex>
        </div>
    );
};

export default FleetVehicleRow;
