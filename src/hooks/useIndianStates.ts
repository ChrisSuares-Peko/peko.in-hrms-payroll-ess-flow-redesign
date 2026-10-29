import { useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { getIndianStates } from '@src/services/indianStates';

let cachedStates: DropDown | null = null;
let pendingRequest: Promise<DropDown> | null = null;

const fetchOnce = (): Promise<DropDown> => {
    if (cachedStates) return Promise.resolve(cachedStates);
    if (!pendingRequest) {
        pendingRequest = getIndianStates().then(states => {
            if (states.length) cachedStates = states;
            pendingRequest = null;
            return states;
        });
    }
    return pendingRequest;
};

const useIndianStates = () => {
    const [stateOptions, setStateOptions] = useState<DropDown>(cachedStates ?? []);
    const [isLoading, setIsLoading] = useState(!cachedStates);

    useEffect(() => {
        let active = true;

        fetchOnce().then(states => {
            if (!active) return;
            setStateOptions(states);
            setIsLoading(false);
        });

        return () => {
            active = false;
        };
    }, []);

    return { stateOptions, isLoading };
};

export default useIndianStates;
