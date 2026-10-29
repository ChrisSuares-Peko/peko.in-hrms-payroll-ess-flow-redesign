import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getClassificationOptions } from '../../api/serviceClassification';
import { ClassificationOption } from '../../types/serviceClassification';

export default function useClassificationOptions() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<ClassificationOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await getClassificationOptions({ userId: id, userType: role });
        setOptions(result ? result.services : []);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        load();
    }, [load]);

    return { options, isLoading, refetch: load };
}
