import { Flex, Image, Typography } from 'antd';

import { retrieveAirlineName } from '../../../utils/airlineData';

interface DynamicImageCardProps {
    item: any;
}
const { Text } = Typography;

export default function DynamicImageCardSm({ item }: DynamicImageCardProps) {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const retrieveFlightClass = (classCode: number) => {
        const flightClass: any = {
            1: 'All',
            2: 'Economy',
            3: 'Premium Economy',
            4: 'Business',
            6: 'First',
        };
        return flightClass[classCode] || 'Unknown Class';
    };

    const logo = `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${item.Airline.AirlineCode}.gif?alt=media`;
    return (
        <Flex align="center" className="w-full">
            <Image preview={false} width={60} alt={logo} src={logo} />

            <Text className="capitalize text-center text-[12px] font-normal">
                {capitalizeFirstLetter(retrieveAirlineName(item.Airline.AirlineCode))},
            </Text>

            <Text className="capitalize font-medium text-center text-[12px] text-[#FF3A3A] ml-2">
                {item.Airline.AirlineCode}-{item.Airline.FlightNumber}
            </Text>

            <div className="flex-grow" />

            <Text className="capitalize font-medium  text-right md:text-xs mr-2 text-xs">
                {retrieveFlightClass(item.CabinClass)}
            </Text>
        </Flex>
    );
}
