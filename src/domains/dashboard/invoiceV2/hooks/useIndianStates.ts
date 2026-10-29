import { useCallback, useEffect, useRef, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getIndianStatesApi } from '../api/settings';

const useIndianStates = ({ autoFetch = true } = {}) => {
    const [stateOptions, setStateOptions] = useState<DropDown>([]);
    const [isLoading, setIsLoading] = useState(false);
    const hasFetched = useRef(false);

    const fetchStates = useCallback(async () => {
        if (hasFetched.current) return;
        setIsLoading(true);
        const states = await getIndianStatesApi();
        hasFetched.current = true;
        setStateOptions(states);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (autoFetch) fetchStates();
    }, [autoFetch, fetchStates]);

    return { stateOptions, isLoading, fetchStates };
};

export default useIndianStates;
