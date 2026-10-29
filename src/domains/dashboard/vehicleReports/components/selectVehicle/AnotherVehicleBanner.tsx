import { ArrowRightOutlined, CarOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

const { Text } = Typography;

interface Props {
    onEnterManually: () => void;
}

// Escape hatch for vehicles that are not in the user's fleet.
const AnotherVehicleBanner = ({ onEnterManually }: Props) => (
    <Flex
        align="center"
        gap={16}
        className="flex-col rounded-2xl bg-[#FFF8F6] p-4 shadow-[0px_2px_20px_rgba(0,0,0,0.04)] sm:flex-row sm:justify-between"
    >
        <Flex align="start" gap={14}>
            <CarOutlined className="mt-1 shrink-0 text-xl text-[#FF4F4F]" />
            <Flex vertical gap={2}>
                <Text className="text-base font-medium text-[#0A0A0A]">
                    Report for another vehicle?
                </Text>
                <Text className="text-sm text-[#667085]">
                    Enter details for a vehicle that is not currently part of your fleet.
                </Text>
            </Flex>
        </Flex>
        <Button type="primary" size="large" className="shrink-0" onClick={onEnterManually}>
            Enter details manually <ArrowRightOutlined />
        </Button>
    </Flex>
);

export default AnotherVehicleBanner;
