import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCorporateServiceOperators } from '../api';
import { ServiceOperatorOption } from '../types/systemUserTypes';

// Loads service operators (id + serviceProvider + accessKey) for the corporate config
// drawers, mapped to Select-friendly options.
const useServiceOperators = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [operators, setOperators] = useState<ServiceOperatorOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOperators = useCallback(async () => {
        setIsLoading(true);
        const data = await getCorporateServiceOperators({ userId: id, userType: role });
        if (data) {
            setOperators(
                data.map(op => ({
                    value: op.id.toString(),
                    label: op.serviceProvider,
                    accessKey: op.accessKey,
                }))
            );
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchOperators();
    }, [fetchOperators]);

    return { operators, isLoading };
};

export default useServiceOperators;
