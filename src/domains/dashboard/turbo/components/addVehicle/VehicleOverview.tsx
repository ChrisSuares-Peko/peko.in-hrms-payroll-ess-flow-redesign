import { Flex, Typography } from 'antd';

import LabelValue from './LabelValue';

const VehicleOverview = ({ vehicleDetails }: any) => (
    <>
        <Typography.Text className="px-2 mt-2 text-sm font-semibold">
            Vehicle Overview
        </Typography.Text>
        <Flex justify="space-between" className="hidden w-full px-2 mt-1 md:flex ">
            {vehicleDetails.map((item: any, index: number) => (
                <LabelValue key={index} label={item.label} value={item.value} />
            ))}
        </Flex>
        <Flex
            justify="space-between"
            className="flex-wrap w-full px-2 mt-1 md:hidden xs:flex"
        >
            {vehicleDetails.map((item: any, index: number) => (
                <LabelValue
                    key={index}
                    label={item.label}
                    value={item.value}
                    className="w-full mb-4 sm:w-1/3 sm:mb-0"
                />
            ))}
        </Flex>
    </>
);

export default VehicleOverview;
