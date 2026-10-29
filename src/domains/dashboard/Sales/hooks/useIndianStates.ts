import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getIndianStatesApi } from '../api/settings';

const useIndianStates = () => {
    const [stateOptions, setStateOptions] = useState<DropDown>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchIndianStates = async () => {
            setIsLoading(true);
            const states = await getIndianStatesApi();
            if (isMounted) {
                setStateOptions(states);
                setIsLoading(false);
            }
        };

        fetchIndianStates();

        return () => {
            isMounted = false;
        };
    }, []);

    return { stateOptions, isLoading };
};

export default useIndianStates;
