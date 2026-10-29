import { Flex, Image, Typography } from 'antd';

import { retrieveAirlineName } from '../../../utils/airlineData';

interface DynamicImageCardProps {
    // item: any;
    flightSegments: any;
}

const { Text } = Typography;

export default function FlightHeader({ flightSegments }: DynamicImageCardProps) {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const logo = `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${flightSegments.Airline.AirlineCode}.gif?alt=media`;

    return (
        <Flex align="center" className="w-full justify-between flex-wrap">
            <Flex align="center">
                <Image preview={false} width={50} alt={logo} src={logo} />
                <Text className="capitalize text-[12px] font-normal ml-2">
                    {capitalizeFirstLetter(retrieveAirlineName(flightSegments.Airline.AirlineCode))}
                </Text>
                <Text className="capitalize font-medium text-[11px] ml-2 text-right">
                    {flightSegments.Airline.AirlineCode}-{flightSegments.Airline.FlightNumber}
                </Text>
            </Flex>
            <Flex align="end" justify="end" gap={5}>
                <Text className="text-gray-400 text-xs font-normal">Marketed by</Text>
                <Flex align="center" gap={5}>
                    <Text className="capitalize text-xs ">
                        {capitalizeFirstLetter(
                            retrieveAirlineName(flightSegments.Airline.AirlineCode)
                        )}
                    </Text>
                    {/* <Image
                        preview={false}
                        height={15}
                        width={30}
                        className="object-contain"
                        alt={flightSegments.marketingAirline}
                        src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${flightSegments.marketingAirline}.gif?alt=media`}
                    /> */}
                </Flex>
            </Flex>
        </Flex>
    );
}
