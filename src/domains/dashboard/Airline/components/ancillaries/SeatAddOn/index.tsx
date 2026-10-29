import { useEffect, useState } from 'react';

import { Button, Collapse, Flex, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import SeatMap from './SeatMap';
import useFindFlightType from '../../../hooks/useFindFlightType';
import { setPassengerAncillaries } from '../../../slices/airlineSlice';
import { SeatResponseType, SegmentSeatType } from '../../../types/ancilaryType';

type Props = {
    seatDynamic: SeatResponseType[];
    passenger: any;
    handleCancel: () => void;
};
const SeatAddOn = ({ seatDynamic, passenger, handleCancel }: Props) => {
    const { sm } = useScreenSize();
    const dispatch = useDispatch();
    const { getFlightType } = useFindFlightType();

    const [selectSeat, setSelectedSeat] = useState<any>([]);

    const { passengers } = useAppSelector(state => state.reducer.airline.bookingData);
    const takenSeats = (passengers || [])
        .filter((p: any) => p.passengerId !== passenger.passengerId)
        .flatMap((p: any) => p.SeatDynamic || []);

    const seatDynamicSegmentArray: SegmentSeatType[] = [];
    seatDynamic.forEach(item => {
        item.SegmentSeat.forEach(RowSeats => {
            seatDynamicSegmentArray.push(RowSeats);
        });
    });

    const flightSegmentsData = seatDynamicSegmentArray.map((item, index) => {
        const seat = item?.RowSeats[0]?.Seats[0];
        const label = `${seat?.Origin || 'NA'} -> ${seat?.Destination || 'NA'}`;
        const flightType = getFlightType(seat?.Origin, seat?.Destination);
        const seatSegment = item.RowSeats.slice(1);
        const isLastSegment = seatDynamic.length === index + 1;

        const i = selectSeat.findIndex(
            (curr: any) =>
                `${curr.Destination} - ${curr.Origin}` === `${seat?.Destination} - ${seat?.Origin}`
        );

        let price: null | string = null;
        if (i !== -1) {
            price = selectSeat[i].Price;
        }
        return {
            key: index,
            label: (
                <Flex justify="space-between">
                    <Flex className="gap-3">
                        {flightType && (
                            <Typography.Text className="text-xs xs375:text-sm font-semibold">
                                {flightType}
                            </Typography.Text>
                        )}{' '}
                        <Flex>{label}</Flex>
                    </Flex>
                    {price !== null ? <Flex>₹ {formatNumberWithLocalString(price)}</Flex> : ''}
                </Flex>
            ),
            children: (
                <>
                    <SeatMap
                        index={index}
                        deck={seatSegment}
                        passenger={passenger}
                        setSelectedSeat={setSelectedSeat}
                        takenSeats={takenSeats}
                    />
                    {/* {!isLastSegment && <Divider />} */}
                </>
            ),
            style: { borderBottom: !isLastSegment ? '1px solid #ddd' : '' },
        };
    });

    const handleSubmit = () => {
        dispatch(
            setPassengerAncillaries({
                passengerId: passenger.passengerId,
                anc: selectSeat,
                ancType: 'SeatDynamic',
            })
        );
        handleCancel();
    };

    useEffect(() => {
        setSelectedSeat(passenger?.SeatDynamic);
    }, [passenger]);

    const price = selectSeat.reduce((acc: number, value: any) => acc + value.Price, 0);

    return (
        <>
            <Collapse
                defaultActiveKey={['0']}
                expandIconPosition="end"
                ghost
                items={flightSegmentsData}
                size={sm ? 'middle' : 'small'}
            />
            <Flex vertical className="ps-4 pe-8 mt-5">
                <Flex justify="space-between">
                    <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold">
                        Total
                    </Typography.Text>
                    <Typography.Text className="text-[1rem]  text-zinc-900 font-semibold">
                        ₹ {formatNumberWithLocalString(price || 0)}
                    </Typography.Text>
                </Flex>
                <Flex className="w-full mt-5" justify="flex-end" gap={10} key="">
                    {/* <Button
                        key="submit"
                        // type="primary"
                        danger
                        onClick={handleCancel}
                        className="rounded-sm"
                    >
                        Cancel
                    </Button> */}
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        onClick={handleSubmit}
                        className="rounded-sm"
                    >
                        Submit
                    </Button>
                </Flex>
            </Flex>
        </>
    );
};

export default SeatAddOn;
