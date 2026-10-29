import { useState, useEffect, type FC } from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Radio, Row, Tooltip, Typography } from 'antd';

import exitmarks from '@src/domains/dashboard/Airline/assets/images/exitmarks.png';
import flightfrontandend from '@src/domains/dashboard/Airline/assets/images/flight-frontandend.png';
import flightbody from '@src/domains/dashboard/Airline/assets/images/flightbody.png';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { RowSeats } from '../../../types/ancilaryType';
import { SeatDynamic } from '../../../types/slices';

interface SeatMapProps {
    index: number;
    deck: RowSeats[];
    passenger: any;
    setSelectedSeat: (value: any) => void;
    takenSeats: SeatDynamic[];
}

const SeatMap: FC<SeatMapProps> = ({ deck, index, passenger, setSelectedSeat, takenSeats }) => {
    const firstDeck = deck[0].Seats[0];
    const name = `${firstDeck?.Destination} - ${firstDeck?.Origin}`;

    const [value, setValue] = useState<any>();

    const renderSeatToolTip = (seat: SeatDynamic): String => {
        try {
            const amount = seat.Price;
            // const currency = seat.Currency;
            const secondPart =
                Number(amount) > 0 ? `- ₹ ${formatNumberWithLocalString(amount)}` : '- Free';
            return `${seat?.Code} ${secondPart}`;
        } catch (error) {
            return `${seat?.Code || ''}`;
        }
    };

    const seatKey = (s: SeatDynamic) => `${s.Origin}${s.Destination}${s.RowNo}${s.SeatNo}`;
    const isTakenByOther = (seat: SeatDynamic) => takenSeats.some(s => seatKey(s) === seatKey(seat));

    const isCurrentSelectedSeat = (seat: SeatDynamic) => {
        if (!value) return false;
        const currSeat = `${value.Origin}${value.Destination}${value.RowNo}${value.SeatNo}`;
        const newSeat = `${seat.Origin}${seat.Destination}${seat.RowNo}${seat.SeatNo}`;
        return currSeat === newSeat;
    };

    const [longestRow, setLongestRow] = useState(0);
    useEffect(() => {
        let longestLength = 0;
        deck.forEach(row => {
            if (row.Seats.length > longestLength) {
                longestLength = row.Seats.length;
            }
        });
        setLongestRow(longestLength);
    }, [deck]);

    useEffect(() => {
        const selected = passenger.SeatDynamic.filter((curr: any) => {
            const currName = `${curr.Destination} - ${curr.Origin}`;
            return currName === name;
        });
        if (selected) {
            setValue(selected[0]);
        }
    }, [passenger, name]);

    const handleUpdate = (udpatedValue: any) => {
        setSelectedSeat((prevValue: any) => {
            const arr = [...prevValue];
            const i = prevValue.findIndex(
                (curr: any) => `${curr.Destination} - ${curr.Origin}` === name
            );
            if (i === -1) {
                arr.push(udpatedValue);
            } else {
                arr[i] = udpatedValue;
            }
            return arr;
        });
        setValue(udpatedValue);
    };

    const [isResetting, setIsResetting] = useState(false);
    const removeAddon = () => {
        setIsResetting(true);
        setSelectedSeat((prevValue: any) => {
            const arr = [...prevValue];
            const i = prevValue.findIndex(
                (curr: any) => `${curr.Destination} - ${curr.Origin}` === name
            );

            return [...arr.slice(0, i), ...arr.slice(i + 1)];
        });
        setIsResetting(false);
        setValue(null);
    };

    return (
        <>
            <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={10}
                className="w-full"
            >
               
                <Flex align="center" wrap="wrap" gap={16}>
                    <Flex align="center" gap={6}>
                        <Radio
                            checked={false}
                            className="m-0 p-0 pointer-events-none"
                        />
                        <Typography.Text className="text-xs sm:text-sm text-neutral-700">
                            Available
                        </Typography.Text>
                    </Flex>
                    <Flex align="center" gap={6}>
                        <Radio
                            checked
                            className="m-0 p-0 pointer-events-none"
                        />
                        <Typography.Text className="text-xs sm:text-sm text-neutral-700">
                            Selected
                        </Typography.Text>
                    </Flex>
                    <Flex align="center" gap={6}>
                        <Radio disabled className="m-0 p-0 pointer-events-none" />
                        <Typography.Text className="text-xs sm:text-sm text-neutral-700">
                            Occupied
                        </Typography.Text>
                    </Flex>
                </Flex>
                <Button
                    danger
                    size="small"
                    onClick={removeAddon}
                    icon={<ReloadOutlined spin={isResetting} />}
                >
                    Reset
                </Button>
            </Flex>

            <Flex key={index} className="overflow-x-auto sm:w-full">
                <Col className="relative w-[89.625rem] h-[29.4375rem] flex flex-row">
                    <Flex className="absolute w-[89.625rem] h-[29.4375rem] top-0 left-0">
                        <Flex className="absolute w-[88rem] h-[20.4375rem] top-[1.1875rem] left-[0.6875rem]">
                            <img
                                className="absolute w-[88rem] h-[21.4375rem] top-[2.875rem] left-0"
                                alt="Group"
                                src={flightfrontandend}
                            />
                            <img
                                className="absolute w-[75rem] h-[27.3125rem] top-0 left-[10.0625rem]"
                                alt="Group"
                                src={flightbody}
                            />
                            <Flex className="absolute w-[88rem] h-[15.8125rem] top-[5.5rem] left-[7.5rem]">
                                <Flex vertical className="px-1 my-auto">
                                    {Array.from({ length: longestRow }, (_, i) => (
                                        <Typography.Text key={i} className="my-4 text-center">
                                            {String.fromCharCode(65 + i)}
                                        </Typography.Text>
                                    ))}
                                </Flex>
                                <Radio.Group
                                    key={index}
                                    value={value}
                                    onChange={e => {
                                        handleUpdate(e.target.value);
                                    }}
                                >
                                    <Row key={index}>
                                        {deck.map((row, i) => (
                                            <Flex key={i} vertical className="px-0">
                                                <Flex className="px-1">{i + 1}</Flex>
                                                <Flex vertical className="my-auto">
                                                    {row.Seats.map(seat => (
                                                        <Tooltip
                                                            title={() => renderSeatToolTip(seat)}
                                                            color="white"
                                                            overlayInnerStyle={{ color: '#FF3A3A' }}
                                                        >
                                                            <Radio
                                                                disabled={
                                                                    seat.AvailablityType !== 1 ||
                                                                    isTakenByOther(seat)
                                                                }
                                                                key={`${seat.SeatNo}`}
                                                                value={seat}
                                                                className="p-1 m-1"
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    if (
                                                                        isCurrentSelectedSeat(seat)
                                                                    ) {
                                                                        setValue(null);
                                                                    }
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                </Flex>
                                            </Flex>
                                        ))}
                                    </Row>
                                </Radio.Group>
                            </Flex>
                            <img
                                className="absolute w-[66.625rem] h-[23.75rem] top-[1.8125rem] left-[12.625rem]"
                                src={exitmarks}
                                alt=""
                            />
                            {/* <ReactSVG
                            className="absolute w-[34px] h-[424px] top-[100px] left-[1272px]"
                            src={backdivider}
                        /> */}
                        </Flex>
                    </Flex>
                </Col>
            </Flex>
            {value && (
                <Flex justify="space-between" className="mt-2 md:mt-4">
                    <Typography.Text className="text-xs md:text-[1rem]  text-zinc-900  font-semibold">
                        Selected Seat
                    </Typography.Text>
                    <Typography.Text className="text-xs md:text-[1rem]  text-zinc-900  font-semibold me-4">
                        {value?.Code}
                    </Typography.Text>
                </Flex>
            )}
            {/* <Flex justify="space-between" className="">
                <Typography.Text className="text-[1rem]  text-zinc-900 font-medium">
                    Price
                </Typography.Text>
                <Typography.Text className="text-[1rem]  text-zinc-900 font-medium me-4">
                    ₹ {formatNumberWithLocalString(value?.Price || 0)}
                </Typography.Text>
            </Flex> */}
        </>
    );
};

export default SeatMap;
