import { useState } from 'react';

import { VendorDirector, addVendorDirectorApi, getVendorBusinessDetailApi } from '../apis';

export default function useVendorDirectors(userId: string | number, role: string) {
    const [directors, setDirectors] = useState<VendorDirector[]>([]);
    const [isLoadingDirectors, setIsLoadingDirectors] = useState(false);
    const [isSavingDirector, setIsSavingDirector] = useState(false);

    const loadDirectors = async (applicationId: string | number | null | undefined) => {
        if (!applicationId) {
            setDirectors([]);
            return;
        }
        setIsLoadingDirectors(true);
        const detail = await getVendorBusinessDetailApi(userId, role, applicationId);
        // Falls back to the vendor's raw promoter_info when the response isn't reshaped into
        // `directors` — same person records either way, just a different top-level key.
        const directorsList = detail?.directors && detail.directors.length > 0 ? detail.directors : (detail?.promoter_info ?? []);
        setDirectors(directorsList);
        setIsLoadingDirectors(false);
    };

    const addDirector = async (
        director: VendorDirector,
        gid: string,
        applicationId: string | number
    ): Promise<{ peopleId: string | null } | null> => {
        setIsSavingDirector(true);
        const saved = await addVendorDirectorApi(userId, role, { ...director, gid, application_id: applicationId });
        setIsSavingDirector(false);
        if (saved) await loadDirectors(applicationId);
        return saved;
    };

    return {
        directors,
        isLoadingDirectors,
        isSavingDirector,
        loadDirectors,
        addDirector,
        setDirectors,
    };
}
