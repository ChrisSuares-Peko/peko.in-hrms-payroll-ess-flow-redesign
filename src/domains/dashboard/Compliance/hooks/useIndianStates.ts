import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getIndianStatesApi } from '../api/settings';

let cachedStates: DropDown | null = null;
let pendingPromise: Promise<DropDown> | null = null;

const fetchOnce = (): Promise<DropDown> => {
    if (cachedStates) return Promise.resolve(cachedStates);
    if (pendingPromise) return pendingPromise;
    pendingPromise = getIndianStatesApi().then(states => {
        cachedStates = states;
        pendingPromise = null;
        return states;
    });
    return pendingPromise;
};

const useIndianStates = () => {
    const [stateOptions, setStateOptions] = useState<DropDown>(cachedStates ?? []);
    const [isLoading, setIsLoading] = useState(!cachedStates);

    useEffect(() => {
        let isMounted = true;
        if (!cachedStates) setIsLoading(true);
        fetchOnce().then(states => {
            if (isMounted) {
                setStateOptions(states);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, []);

    return { stateOptions, isLoading };
};

export default useIndianStates;
