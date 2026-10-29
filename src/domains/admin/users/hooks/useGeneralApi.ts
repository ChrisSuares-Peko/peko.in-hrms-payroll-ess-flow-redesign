import { useCallback, useEffect, useState } from 'react';

import { stateOptions } from '../api/index';
import { StateListResponse } from '../types/corporateUserTypes';

export default function useGeneralApi() {
    const [isLoading, setIsLoading] = useState(true);
    const [stateData, setStateData] = useState<{ label: string; value: string }[]>();

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
