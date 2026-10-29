import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { addRoom, deleteRoom, handleCount } from '../slices/getHotelSlice';

interface RoomDetails {
    adult: number;
    child: number;
}

export default function RoomCount() {
    const dispatch = useAppDispatch();
    const { hotelsRequest } = useAppSelector(state => state.reducer.hotels);
    const [room, setRooms] = useState<RoomDetails[]>([{ adult: 1, child: 0 }]);

    const handleCountChange = (type: 'adult' | 'child', increment: boolean, index: number) => {
        const { rooms } = hotelsRequest;
        const maxAdults = 8;
        const maxChildren = 4;
        if (!increment && rooms[index][type] === 0) {
            return;
        }
        if (!increment && type === 'adult' && rooms[index][type] === 1) {
            return;
        }
        // @ts-ignore
        // if (Object.values(obj).reduce((total, count) => total + count, 0) >= 4 && increment) {
        //     return;
        // }
        if (increment) {
            if (type === 'adult' && rooms[index].adult >= maxAdults) {
                return;
            }
            if (type === 'child' && rooms[index].child >= maxChildren) {
                return;
            }
        }
        dispatch(handleCount({ type, increment, index }));
    };

    function roomDelete(index: number) {
        dispatch(deleteRoom({ index }));
    }
    const handleAddRoom = () => {
        dispatch(addRoom());
    };
    const getTotalAdults = (): number =>
        room.reduce((totalAdults, roomData) => totalAdults + roomData.adult, 0);

    const getTotalchildren = (): number =>
        room.reduce((totalChildren, roomData) => totalChildren + roomData.child, 0);

    const totalAdults = getTotalAdults();
    const totalChildren = getTotalchildren();

    return {
        rooms: room,
        setRooms,
        handleCountChange,
        roomDelete,
        handleAddRoom,
        totalAdults,
        totalChildren,
    };
}
