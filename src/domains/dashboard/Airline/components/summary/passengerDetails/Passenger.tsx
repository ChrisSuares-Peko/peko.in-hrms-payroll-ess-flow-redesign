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
        <Col key={index} xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card variant="outlined">
                <Flex className="mb-3">
                    <Text strong>{`Passenger ${index + 1}`}</Text>
                </Flex>

                <Flex justify="space-between" className="mt-2">
                    <Flex vertical gap={5} justify="start" className="mr-4">
                        <Text className="text-textGreyColor">Name </Text>
                        <Text strong>
                            {/* Title (e.g. Mr/Mrs) hidden for now — auto-derived from gender, not collected, so name only. Re-enable when title collection is added. */}
                            {/* {`${passenger.Title}. ${passenger.FirstName} ${passenger.LastName}`} */}
                            {`${passenger.FirstName} ${passenger.LastName}`}
                        </Text>
                        {passenger.PassportNo && (
                            <>
                                <Text className="text-textGreyColor">Passport Number </Text>
                                <Text strong>{passenger.PassportNo}</Text>
                            </>
                        )}
                        {passenger.Email && (
                            <>
                                <Text className="text-textGreyColor">Email ID </Text>
                                <Text strong>{passenger.Email}</Text>
                            </>
                        )}
                    </Flex>
                    <Flex vertical gap={5} justify="start">
                        {passenger.DateOfBirth && (
                            <>
                                <Text className="text-textGreyColor">Date of Birth </Text>
                                <Text strong>{formatToDDMMYYYY(passenger.DateOfBirth)}</Text>
                            </>
                        )}
                        {passenger.PassportExpiry && (
                            <>
                                <Text className="text-textGreyColor">Passport Expiry</Text>
                                <Text strong>{formatToDDMMYYYY(passenger.PassportExpiry)}</Text>
                            </>
                        )}
                        {passenger.ContactNo && passenger.CellCountryCode && (
                            <>
                                <Text className="text-textGreyColor">Mobile Number</Text>
                                <Text strong className="whitespace-nowrap">
                                    {passenger.CellCountryCode} {passenger.ContactNo}
                                </Text>
                            </>
                        )}
                    </Flex>
                </Flex>

                {hasAddons && (
                    <>
                        <Divider className="my-3" />
                        <Flex vertical gap={6}>
                            <Text strong>Add-ons</Text>
                            {seats.length > 0 && (
                                <Flex vertical gap={2}>
                                    <Text className="text-textGreyColor">Seats</Text>
                                    {seats.map((s: any, i: number) => (
                                        <Text key={`seat-${i}`} strong>
                                            {formatSeat(s)}
                                        </Text>
                                    ))}
                                </Flex>
                            )}
                            {meals.length > 0 && (
                                <Flex vertical gap={2}>
                                    <Text className="text-textGreyColor">Meals</Text>
                                    {meals.map((m: any, i: number) => (
                                        <Text key={`meal-${i}`} strong>
                                            {formatMeal(m)}
                                        </Text>
                                    ))}
                                </Flex>
                            )}
                            {baggage.length > 0 && (
                                <Flex vertical gap={2}>
                                    <Text className="text-textGreyColor">Extra Baggage</Text>
                                    {baggage.map((b: any, i: number) => (
                                        <Text key={`bag-${i}`} strong>
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
