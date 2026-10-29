import { Card, Col, Divider, Flex, Row, Typography } from 'antd';

// import FlightHeader from './FlightHeader';
import DurationBadgeSm from './DurationBadgeSm';
import FlightHeader from './FlightHeader';
import { retrieveAirport } from '../../../utils/airlineData';
import { formattedTimeOnly, shortDateFormat } from '../../../utils/dateTime';
import LayoverDivider from '../../LayoverDivider';

const { Text } = Typography;

type Props = {
    item: any;
};

const FlightCardDetailsAdaptive = ({ item }: Props) => {
    function formatWeight(weight: string) {
        if (!weight) return 'NA';
        return weight.replace('Kilograms', ' kg').replace('KG', ' kg');
    }
    return (
        <Card className="mx-0 mb-4 shadow-lg border-1 border-gray-300" size="small">
            {item?.map((ele: any, index: number) => {
                const nextSegment = item?.[index + 1];
                return (
                    <Col key={index} className="mb-5" span={24}>
                        <>
                            <Row className="flex flex-col border-0 h-18  py-1  w-full ">
                                <FlightHeader flightSegments={ele} />
                            </Row>
                            <Divider className="w-full m-0 p-0 block" />
                            <Row
                                className="mb-3 w-full mt-2"
                                justify="space-between"
                                align="middle"
                            >
                                <Col span={8} className="flex flex-col   md:items-center">
                                    <Text className="text-[#86898B]  text-[0.60rem]  xxl:text-base font-[500]  line-clamb-1 whitespace-nowrap ">
                                        {retrieveAirport(ele.Origin.Airport.AirportCode)}
                                    </Text>
                                    <Text className=" text-[1.40rem] font-semibold ">
                                        {ele.Origin.Airport.AirportCode}
                                    </Text>
                                    <Flex className=" items-center ">
                                        <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                            {formattedTimeOnly(new Date(ele.Origin.DepTime))}
                                        </Text>
                                        <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                            , {shortDateFormat(new Date(ele.Origin.DepTime))}
                                        </Text>
                                    </Flex>

                                    <Text className="text-[#86898B] text-[0.60rem] font-[500] line-clamb-1 whitespace-nowrap ">
                                        {ele?.Origin.Airport.AirportName}
                                    </Text>
                                    <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                        Terminal{' '}
                                        {ele?.Origin.Airport.Terminal
                                            ? `${ele?.Origin.Airport.Terminal}`
                                            : 'N/A'}
                                    </Typography.Text>
                                </Col>

                                <Col span={8} className="flex flex-col items-center justify-center">
                                    <Flex
                                        vertical
                                        className="w-full h-full"
                                        justify="center"
                                        align="center"
                                    >
                                        <DurationBadgeSm duration={ele.Duration} />
                                    </Flex>
                                </Col>
                                <Col span={8} className="flex flex-col items-end ">
                                    <Text className="text-[#86898B] text-[0.60rem] font-[500] line-clamb-1 whitespace-nowrap ">
                                        {retrieveAirport(ele.Destination.Airport.AirportCode)}
                                    </Text>
                                    <Text className=" text-[1.40rem] font-semibold line-clamp-1 whitespace-nowrap">
                                        {ele.Destination.Airport.AirportCode}
                                    </Text>
                                    <Flex className=" items-center">
                                        <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                            {formattedTimeOnly(new Date(ele.Origin.DepTime))}
                                        </Text>
                                        <Text className="font-medium text-[0.6rem]  whitespace-nowrap">
                                            , {shortDateFormat(new Date(ele.Origin.DepTime))}
                                        </Text>
                                    </Flex>
                                    <Text className="text-[#86898B] text-[0.60rem] font-[500] line-clamb-1 whitespace-nowrap ">
                                        {ele?.Destination.Airport.AirportName}
                                    </Text>
                                    <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                        Terminal{' '}
                                        {ele?.Destination.Airport.Terminal
                                            ? `${ele?.Destination.Airport.Terminal}`
                                            : 'N/A'}
                                    </Typography.Text>
                                </Col>
                            </Row>
                            <Flex vertical>
                                <Text className="text-[#86898B] font-[500] line-clamb-1 whitespace-nowrap ">
                                    {ele.Baggage && (
                                        <>
                                            <Text className="text-[#434343] text-[0.65rem] font-[400] line-clamb-1 whitespace-nowrap">
                                                Cabin Baggage :
                                            </Text>
                                            <Text className="text-[#434343] text-[0.65rem] font-[500] line-clamb-1 whitespace-nowrap">
                                                {' '}
                                                {formatWeight(ele.Baggage)}
                                            </Text>
                                        </>
                                    )}
                                </Text>
                                <Text className="text-[#86898B] text-xs font-[500] line-clamb-1 whitespace-nowrap ">
                                    {ele.CabinBaggage && (
                                        <>
                                            <Text className="text-[#434343]  text-[0.65rem] font-[400] line-clamb-1 whitespace-nowrap">
                                                Check-In Baggage :
                                            </Text>
                                            <Text className="text-[#434343]  text-[0.65rem] font-[500] line-clamb-1 whitespace-nowrap">
                                                {' '}
                                                {formatWeight(ele.CabinBaggage)}
                                            </Text>
                                        </>
                                    )}
                                </Text>
                            </Flex>
                        </>
                        <LayoverDivider nextSegment={nextSegment} prevSegment={ele} />
                    </Col>
                );
            })}
        </Card>
    );
};

export default FlightCardDetailsAdaptive;
