import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

export default function useGetCarbonResultData(state: any) {
    const [advancedCal, setAdvancedCal] = useState<boolean>(false);
    const [totalCo2Usage, setTotalCo2Usage] = useState<any>();
    const [groupedByCategory, setGroupedByCategory] = useState<any>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (state) {
            setTotalCo2Usage(state.data.totalCo2Usage);
            setGroupedByCategory(state.data.groupedByCategory);
            setTimeout(() => {
                setIsLoading(false);
            }, 1500);
            if (state.advanced) setAdvancedCal(true);
            else setAdvancedCal(false);
        } else navigate(`/${paths.zeroCarbon.index}/${paths.zeroCarbon.carbonCalculator}`);
    }, [navigate, state]);

    return { advancedCal, totalCo2Usage, groupedByCategory, isLoading };
}
