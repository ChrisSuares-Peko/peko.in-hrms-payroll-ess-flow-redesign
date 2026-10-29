import type { FC } from 'react';

import { Card, Col, Divider, Flex, Typography } from 'antd';

import { formatToDDMMYYYY } from '@utils/dateFormat';

import { Passenger as PassengerType } from '../../../types/slices';

const { Text } = Typography;

interface PassengerProps {
    passenger: PassengerType;
    index: number;
}

const formatSeat = (s: any) =>
    `${s?.Origin || ''}-${s?.Destination || ''}: ${s?.RowNo || ''}${s?.SeatNo || ''}`.trim();

const formatMeal = (m: any) =>
    `${m?.Origin || ''}-${m?.Destination || ''}: ${m?.AirlineDescription || m?.Code || ''}`.trim();

const formatBaggage = (b: any) =>
    `${b?.Origin || ''}-${b?.Destination || ''}: +${b?.Weight ?? ''}kg`.trim();

const Passenger: FC<PassengerProps> = ({ passenger, index }) => {
    const seats = Array.isArray(passenger.SeatDynamic) ? passenger.SeatDynamic : [];
    const meals = Array.isArray(passenger.MealDynamic) ? passenger.MealDynamic : [];
    const baggage = Array.isArray(passenger.Baggage) ? passenger.Baggage : [];
    const hasAddons = seats.length > 0 || meals.length > 0 || baggage.length > 0;

    return (
        <Col key={index} xs={24}>
            <Card
                variant="outlined"
                className="border-2 [border-radius:10px] p-4"
                styles={{ body: { padding: 0 } }}
            >
                <Flex className="mb-3">
                    <Text strong>{`Passenger ${index + 1}`}</Text>
                </Flex>

                <Flex justify="space-between" className="mt-2">
                    <Flex vertical gap={5} justify="start" className="mr-4">
                        <Text className="text-textGreyColor text-[12px]">Name </Text>
                        <Text strong className="text-[12px]">
                            {/* Title (e.g. Mr/Mrs) hidden for now — auto-derived from gender, not collected, so name only. Re-enable when title collection is added. */}
                            {/* {`${passenger.Title}. ${passenger.FirstName} ${passenger.LastName}`} */}
                            {`${passenger.FirstName} ${passenger.LastName}`}
                        </Text>
                        {passenger.PassportNo && (
                            <>
                                <Text className="text-textGreyColor text-[12px]">
                                    Passport Number{' '}
                                </Text>
                                <Text strong className="text-[12px]">
                                    {passenger.PassportNo}
                                </Text>
                            </>
                        )}
                        {passenger.Email && (
                            <>
                                <Text className="text-textGreyColor text-[12px]">Email ID </Text>
                                <Text strong className="text-[12px]">
                                    {passenger.Email}
                                </Text>
                            </>
                        )}
                    </Flex>
                    <Flex vertical gap={5} justify="start">
                        {passenger.DateOfBirth && (
                            <>
                                <Text className="text-textGreyColor text-[12px]">
                                    Date of Birth{' '}
                                </Text>
                                <Text
                                    strong
                                    className="text-[12px]"
                                >{passenger.DateOfBirth ? formatToDDMMYYYY(passenger.DateOfBirth) : 'NA'}</Text>
                            </>
                        )}
                        {passenger.PassportExpiry && (
                            <>
                                <Text className="text-textGreyColor text-[12px]">
                                    Passport Expiry
                                </Text>
                                <Text strong className="text-[12px]">
                                    {passenger.PassportExpiry ? formatToDDMMYYYY(passenger.PassportExpiry) : 'NA'}
                                </Text>
                            </>
                        )}
                        <Text className="text-textGreyColor text-[12px]">Mobile Number</Text>
                        <Text strong className="whitespace-nowrap text-[12px]">
                            {passenger.CellCountryCode} {passenger.ContactNo}
                        </Text>
                    </Flex>
                </Flex>

                {hasAddons && (
                    <>
                        <Divider className="my-3" />
                        <Flex vertical gap={6}>
                            <Text strong className="text-[12px]">Add-ons</Text>
                            {seats.length > 0 && (
                                <Flex vertical gap={2}>
                                    <Text className="text-textGreyColor text-[12px]">Seats</Text>
                                    {seats.map((s: any, i: number) => (
                                        <Text key={`seat-${i}`} strong className="text-[12px]">
                                            {formatSeat(s)}
                                        </Text>
                                    ))}
                                </Flex>
                            )}
                            {meals.length > 0 && (
                                <Flex vertical gap={2}>
                                    <Text className="text-textGreyColor text-[12px]">Meals</Text>
                                    {meals.map((m: any, i: number) => (
                                        <Text key={`meal-${i}`} strong className="text-[12px]">
                                            {formatMeal(m)}
                                        </Text>
                                    ))}
                                </Flex>
                            )}
                            {baggage.length > 0 && (
                                <Flex vertical gap={2}>
                                    <Text className="text-textGreyColor text-[12px]">Extra Baggage</Text>
                                    {baggage.map((b: any, i: number) => (
                                        <Text key={`bag-${i}`} strong className="text-[12px]">
                                            {formatBaggage(b)}
                                        </Text>
                                    ))}
                                </Flex>
                            )}
                        </Flex>
                    </>
                )}
            </Card>
        </Col>
    );
};

export default Passenger;
