import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { classifyService } from '../../api/serviceClassification';
import { ServiceClassification } from '../../types/serviceClassification';
import { describeClassifyResult } from '../../utils/serviceClassification';

type ClassifyInput = {
    accessKey: string;
    serviceProvider: string;
    planType: ServiceClassification;
};

export default function useClassifyService() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const classify = useCallback(
        async ({ accessKey, serviceProvider, planType }: ClassifyInput) => {
            setSavingKey(accessKey);
            const result = await classifyService({
                userId: id,
                userType: role,
                accessKey,
                planType,
            });
            setSavingKey(null);
            if (result) dispatch(showToast(describeClassifyResult(serviceProvider, result)));
            return result;
        },
        [dispatch, id, role]
    );

    return { classify, savingKey };
}
