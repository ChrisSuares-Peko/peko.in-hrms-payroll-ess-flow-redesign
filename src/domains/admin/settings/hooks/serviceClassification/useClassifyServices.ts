import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { classifyServices } from '../../api/serviceClassification';
import { ClassificationOption, ServiceClassificationTab } from '../../types/serviceClassification';
import { describeClassifyServicesResult } from '../../utils/serviceClassification';

type ClassifyManyInput = {
    services: ClassificationOption[];
    planType: ServiceClassificationTab;
};

export default function useClassifyServices() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isSaving, setIsSaving] = useState(false);

    const classifyMany = useCallback(
        async ({ services, planType }: ClassifyManyInput) => {
            setIsSaving(true);
            const result = await classifyServices({
                userId: id,
                userType: role,
                accessKeys: services.map(service => service.accessKey),
                planType,
            });
            setIsSaving(false);
            if (result) {
                const nameOf = (accessKey: string) =>
                    services.find(service => service.accessKey === accessKey)?.serviceProvider ??
                    accessKey;
                dispatch(
                    showToast(describeClassifyServicesResult(planType, result.results, nameOf))
                );
            }
            return result;
        },
        [dispatch, id, role]
    );

    return { classifyMany, isSaving };
}
