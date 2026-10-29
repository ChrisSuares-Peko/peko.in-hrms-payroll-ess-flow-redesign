import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getPartnerInitialSidebar, updatePartnerInitialSidebar } from '../api';
import { CorpInitialSidebarNode, CorpSearchServiceEntry } from '../types/systemUserTypes';

// Loads and persists the corporate initial sidebar tree
// (settings.partnerInitialAccessesibleServices) for the Corporate User Configuration page.
const useCorporateConfig = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [sidebarData, setSidebarData] = useState<CorpInitialSidebarNode[]>();
    const [isSaving, setIsSaving] = useState(false);

    const getSidebar = useCallback(async () => {
        const data = await getPartnerInitialSidebar();
        if (data) setSidebarData(data.sidebarData ?? []);
    }, []);

    const saveCorporateConfig = useCallback(
        async (payload: CorpInitialSidebarNode[], searchServices: CorpSearchServiceEntry[]) => {
            setIsSaving(true);
            const data: SuccessGenericResponse<{ sidebarData: CorpInitialSidebarNode[] }> | false =
                await updatePartnerInitialSidebar({
                    userId: id,
                    userType: role,
                    sidebarData: payload,
                    searchServices,
                });
            setIsSaving(false);
            return data;
        },
        [id, role]
    );

    useEffect(() => {
        getSidebar();
    }, [getSidebar]);

    return { sidebarData, saveCorporateConfig, isSaving };
};

export default useCorporateConfig;
