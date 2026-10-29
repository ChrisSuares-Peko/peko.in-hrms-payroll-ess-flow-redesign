import { useCallback, useEffect, useState } from 'react';

import { stateOptions } from '../api/index';
import { OptionsType, StateListResponse } from '../types/index';

export default function useGeneralApi() {
    const [isLoading, setIsLoading] = useState(true);
    const [stateData, setStateData] = useState<OptionsType[]>();

    const getDashboardDropDownData = useCallback(async () => {
        const data: StateListResponse | false = await stateOptions();

        if (data) {
            setStateData(data.states);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getDashboardDropDownData();
    }, [getDashboardDropDownData]);

    return { isLoading, stateData };
}
