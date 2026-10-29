import React, { useState } from 'react';

import { Col, Collapse, Flex, Radio, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import backdivider from '@src/domains/dashboard/Airline/assets/icons/backdivider.svg';
import exitmarks from '@src/domains/dashboard/Airline/assets/images/exitmarks.png';
import flightfrontandend from '@src/domains/dashboard/Airline/assets/images/flight-frontandend.png';
import flightbody from '@src/domains/dashboard/Airline/assets/images/flightbody.png';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { setSelectedAncillaries } from '../slices/airlineSlice';
import { AncillarySearch } from '../types/ancilaryType';

type Props = {
    passengerKey: string;
};
const SeatAddOn = ({ passengerKey }: Props) => {
    const [, setSelectedSeatDetails] = useState({
        fare: '',
        seat: '',
    });
    const dispatch = useAppDispatch();
    const ancillariesData: AncillarySearch = useAppSelector(
        state => state.reducer.airline.ancillariesSearch
    ) as AncillarySearch;

    const { flightSegments, seatMap } = ancillariesData.data[0];

    const handleSelectedAnc = (val: any) => {
        const selectedAnc = {
            ancType: 'seat',
            ancillaryOfferId: val.ancillaryOfferId,
            passengerKey,
            segmentKey: val.segmentKey,
        };
        dispatch(setSelectedAncillaries(selectedAnc));
    };

    const flightSegmentsData = flightSegments.map((item, index) => ({
        key: index,
        label: `${item.departureAirportCode} -> ${item.arrivalAirportCode}`,
        children: (
            <>
                {seatMap[0].cabin[0].deck.map(deck => (
                    <Flex className="overflow-x-auto sm:w-full hide-scrollbar">
                        <Col className="relative w-[1434px] h-[471px] flex flex-row">
                            <Flex className="absolute w-[1434px] h-[471px] top-0 left-0">
                                <Flex className="absolute w-[1405px] h-[327px] top-[19px] left-[11px]">
                                    <img
                                        className="absolute w-[1405px] h-[343px] top-[46px] left-0"
                                        alt="Group"
                                        src={flightfrontandend}
                                    />
                                    <img
                                        className="absolute w-[1200px] h-[437px] top-0 left-[161px]"
                                        alt="Group"
                                        src={flightbody}
                                    />
                                    <Flex className="absolute w-[1400px] h-[253px] top-[88px] left-[120px]">
                                        <Flex vertical className="px-1 my-auto">
                                            {deck.airRow[0].airSeats.map((char, ind) => (
                                                <Typography.Text className="my-4 text-center">
                                                    {String.fromCharCode(65 + ind)}
                                                </Typography.Text>
                                            ))}
                                        </Flex>
                                        <Radio.Group
                                            onChange={e => {
                                                setSelectedSeatDetails({
                                                    seat: e.target.value.seatCode,
                                                    fare: e.target.value.fare,
                                                });
                                                handleSelectedAnc({
                                                    segmentKey: item.segmentKey,
                                                    ancillaryOfferId:
                                                        e.target.value.ancillaryOfferId,
                                                });
                                            }}
                                        >
                                            <Row key={index}>
                                                {deck.airRow.map((row, i) => (
                                                    <Flex vertical className="px-1 my-auto">
                                                        <Flex className="px-1 my-auto">
                                                            {i + 1}
                                                        </Flex>
                                                        {row.airSeats.map(seat => (
                                                            <Radio
                                                                disabled={
                                                                    seat.availability !== 'VAC'
                                                                }
                                                                key={`${seat.seatCode}${seat.ancillaryOfferId}`}
                                                                value={seat}
                                                                className="m-1 p-1"
                                                            />
                                                        ))}
                                                    </Flex>
                                                ))}
                                            </Row>
                                        </Radio.Group>
                                    </Flex>
                                    <img
                                        className="absolute w-[1066px] h-[380px] top-[29px] left-[202px]"
                                        src={exitmarks}
                                        alt=""
                                    />
                                    <ReactSVG
                                        className="absolute w-[34px] h-[424px] top-[100px] left-[1272px]"
                                        src={backdivider}
                                    />
                                </Flex>
                            </Flex>
                        </Col>
                    </Flex>
                ))}
            </>
        ),
    }));
    return <Collapse expandIconPosition="end" ghost items={flightSegmentsData} />;
};
export default SeatAddOn;
