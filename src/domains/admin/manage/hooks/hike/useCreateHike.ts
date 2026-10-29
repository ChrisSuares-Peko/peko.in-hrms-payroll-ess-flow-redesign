import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createHike, updateHike } from '../../api/hike';
import { newHike } from '../../types/hike';

const UseCreateHike = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const createNewHike = useCallback(
        async (payload: newHike) => {
            setIsLoading(true);
            const data: any | false = await createHike({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    const updateCurrentHike = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateHike({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return data;
            }
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    return { isLoading, createNewHike, updateCurrentHike };
};

export default UseCreateHike;
