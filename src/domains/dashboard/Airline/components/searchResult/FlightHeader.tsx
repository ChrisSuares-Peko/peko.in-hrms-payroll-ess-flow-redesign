import { Flex, Image, Typography } from 'antd';

import { retrieveAirlineName } from '../../utils/airlineData';

interface DynamicImageCardProps {
    journey: any;
}

const { Text } = Typography;

export default function FlightHeader({ journey }: DynamicImageCardProps) {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const logo = `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${journey.Airline.AirlineCode}.gif?alt=media`;

    return (
        <Flex align="center" className="w-full ">
            <Flex align="center">
                <Image preview={false} width={50} alt={logo} src={logo} />
                <Text className="capitalize text-[12px] font-normal ml-2">
                    {capitalizeFirstLetter(retrieveAirlineName(journey.Airline.AirlineCode))},
                </Text>
            </Flex>

            <Text className="capitalize font-medium text-[11px] ml-2 text-right">
                {journey.Airline.AirlineCode}-{journey.Airline.FlightNumber}
            </Text>
        </Flex>
    );
}
