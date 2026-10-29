import { Flex, Skeleton, Typography } from 'antd';

import EmptyFleetState from './EmptyFleetState';
import FleetVehicleRow from './FleetVehicleRow';
import { SelectedVehicle } from '../../types/index';

interface Props {
    vehicles: SelectedVehicle[];
    isLoading: boolean;
    selectedNumber?: string;
    onSelect: (vehicle: SelectedVehicle) => void;
    onAddVehicle: () => void;
}

// "Select from your fleet" card: a titled header over the vehicle rows, or the
// empty state when the fleet has no vehicles.
const FleetVehiclePicker = ({
    vehicles,
    isLoading,
    selectedNumber,
    onSelect,
    onAddVehicle,
}: Props) => (
    <div className="rounded-2xl bg-white shadow-[0px_2px_20px_rgba(0,0,0,0.04)]">
        <div className="border-b border-[#EFF1F4] px-5 py-4">
            <Typography.Text className="text-base font-medium text-[#0A0A0A]">
                Select from your fleet
            </Typography.Text>
        </div>
        {isLoading && <Skeleton active className="p-5" paragraph={{ rows: 4 }} />}
        {!isLoading && !vehicles.length && <EmptyFleetState onAddVehicle={onAddVehicle} />}
        {!isLoading && !!vehicles.length && (
            <Flex vertical gap={12} className="p-3">
                {vehicles.map(vehicle => (
                    <FleetVehicleRow
                        key={vehicle.id ?? vehicle.vehicleNumber}
                        vehicle={vehicle}
                        isSelected={selectedNumber === vehicle.vehicleNumber}
                        onSelect={() => onSelect(vehicle)}
                    />
                ))}
            </Flex>
        )}
    </div>
);

export default FleetVehiclePicker;
