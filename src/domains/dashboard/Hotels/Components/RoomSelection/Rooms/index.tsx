import { useEffect, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Flex, Typography, Image } from 'antd';
import { Content } from 'antd/es/layout/layout';

import roomNotAvailable from '@domains/dashboard/Hotels/Assets/icons/roomNotAvailable.svg';
import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import RoomCard from './RoomCard';
import { formatRoomName, priceLabel } from './roomFormatters';

interface roomsProps {
    rooms: any[];
    handleRoomSelect: any;
    reset: boolean;
    selectedBookingCode: any;
}

const Rooms = ({ rooms, handleRoomSelect, reset, selectedBookingCode }: roomsProps) => {
     const { hotelsRequest } = useAppSelector(state => state.reducer.hotels);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selected, setSelected] = useState<any>();

    const checkIn = new Date(hotelsRequest.CheckIn);
    const checkout = new Date(hotelsRequest.CheckOut);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const nightDifference = Math.ceil((checkout.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));

    const handleSelectionChange = (room: any) => {
        let totalSum = 0;

        room.DayRates.forEach((roomArray: any) => {
            roomArray.forEach((value: any) => {
                totalSum += value.BasePrice;
            });
        });

        const taxes = room.TotalTax;
        setSelected(room.BookingCode);
        handleRoomSelect(room.BookingCode, room.TotalFare, totalSum, taxes, room?.Supplements);
    };

    useEffect(() => {
        // Set the first room as selected by default when component loads
        if (rooms.length > 0) {
            handleSelectionChange(rooms[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rooms]);

    useEffect(() => {
        if (reset) {
            setSelected(undefined);
        }
    }, [reset]);

    const selectedRoom = rooms.find(room => room.BookingCode === selectedBookingCode);
    const selectedRoomNames: string[] = selectedRoom?.Name ?? [];

    return (
        <Content className="w-full">
            {/* Conditional rendering for 'Rooms Not Available' */}
            {rooms.length === 0 && (
                <Flex className="max-h-80 mt-10 items-center justify-center">
                    <Image className="mt-1" src={roomNotAvailable} preview={false} />
                </Flex>
            )}

            <div className="flex gap-4 overflow-x-auto w-full pb-2">
                {rooms.map((room: any, index: number) => (
                    <RoomCard
                        key={room.BookingCode}
                        room={room}
                        optionIndex={index}
                        selected={selectedBookingCode === room.BookingCode}
                        onSelect={() => handleSelectionChange(room)}
                    />
                ))}
            </div>

            {selectedRoom && (
                <Flex
                    vertical
                    gap={20}
                    className="hidden bg-white border border-gray-200 rounded-2xl p-6 mt-4 w-full"
                >
                    {selectedRoomNames.map((name, index) => (
                        <Flex key={index} justify="space-between" align="center" className="w-full">
                            <Typography.Text className="text-lg font-semibold text-slate-800">
                                Room {index + 1} - {formatRoomName(name)}
                            </Typography.Text>
                            <CheckCircleFilled className="text-green-500 text-2xl" />
                        </Flex>
                    ))}
                    <div className="border-t border-gray-200 w-full" />
                    <Typography.Text className="text-base text-slate-500">
                        ₹ {formatNumberWithLocalString(selectedRoom.TotalFare)}{' '}
                        {priceLabel(selectedRoom)}
                    </Typography.Text>
                </Flex>
            )}
        </Content>
    );
};

export default Rooms;
