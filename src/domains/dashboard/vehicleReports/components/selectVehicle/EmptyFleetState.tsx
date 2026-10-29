import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import getVehicleImage from '../../../turbo/utils/getVehicleImage';

const { Text, Title } = Typography;

interface Props {
    onAddVehicle: () => void;
}

// Shown inside the "Select from your fleet" card when the user has no vehicles.
const EmptyFleetState = ({ onAddVehicle }: Props) => (
    <Flex vertical align="center" gap={12} className="px-6 py-10 text-center">
        <div className="relative mb-2 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#F2F4F7]">
            <img
                src={getVehicleImage()}
                alt=""
                className="h-[26px] w-[42px] object-contain opacity-60"
            />
            <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-[3px] border-[#98A2B3]" />
        </div>
        <Title level={5} className="!mb-0 !text-[#0A0A0A]">
            Your fleet is empty
        </Title>
        <Text className="max-w-[520px] text-sm text-[#667085]">
            Add your vehicle to get Valuation Reports, Vehicle History Reports, Vehicle
            Inspections, and more.
        </Text>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onAddVehicle}>
            Add Vehicle
        </Button>
    </Flex>
);

export default EmptyFleetState;
