import { useCallback, useEffect, useState } from 'react';

import { getSelectTagData } from '../api/index';
import { SelectTag, SelectTagResponse } from '../types/index';

export default function useSelectApi() {
    const [isLoading, setIsLoading] = useState(true);
    const [paymentModeData, setPaymentModeData] = useState<SelectTag[]>();
    const [yearsData, setYearsData] = useState<SelectTag[]>();
    const [monthsData, setMonthsData] = useState<SelectTag[]>();

    const getDashboardDropDownData = useCallback(async () => {
        const data: SelectTagResponse | false = await getSelectTagData();

        if (data) {
            setPaymentModeData(data.paymentMode);
            setYearsData(data.years);
            setMonthsData(data.months);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getDashboardDropDownData();
    }, [getDashboardDropDownData]);

    return { paymentModeData, monthsData, yearsData, isLoading };
}
