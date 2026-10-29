import { Flex, Image, Typography } from 'antd';

import { retrieveAirlineName } from '../../../utils/airlineData';

interface DynamicImageCardProps {
    item: any;
}

export default function DynamicImageCard({ item }: DynamicImageCardProps) {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    // const operatingAirlines = flightSegments.map(
    //     (segment: { operatingAirline: any }) => segment.operatingAirline
    // );
    // const uniqueOperatingAirlines = [...new Set(operatingAirlines)];
    const uniqueOperatingAirlines = [item[0].Airline.AirlineCode];
    const logo = `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${item[0].Airline.AirlineCode}.gif?alt=media`;

    const flightNumbers = item.map(
        (segment: any) => `${segment.Airline.AirlineCode}-${segment.Airline.FlightNumber}`
    );
    const uniqueFlightNumbers = [...new Set(flightNumbers)].join(' | ');
    return uniqueOperatingAirlines.length > 1 ? (
        <Flex vertical align="center" justify="center">
            {uniqueOperatingAirlines.map((v, i) => (
                <Image
                    key={i}
                    preview={false}
                    width={60}
                    alt={item[0].v}
                    src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${v}.gif?alt=media`}
                />
            ))}
            <Typography.Text className="text-center mt-1 text-sm font-normal text-[#6B6B6B]">
                Multiple Airlines
            </Typography.Text>
        </Flex>
    ) : (
        <>
            <Image preview={false} width={80} alt={logo} src={logo} />
            <Typography.Text className="capitalize text-center mt-2 font-medium">
                {capitalizeFirstLetter(retrieveAirlineName(item[0].Airline.AirlineCode))}
            </Typography.Text>
            <Typography.Text className="capitalize text-center md:text-xs">
                {uniqueFlightNumbers}
            </Typography.Text>
        </>
    );
}
