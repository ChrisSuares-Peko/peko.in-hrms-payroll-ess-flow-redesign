import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { createBusinessProfile } from '../api/index';
import { WHATSAPP_DEMO_EMAIL } from '../utils/index';

export function useCreateBusinessProfileApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const isDemoAccount =
        useAppSelector(
            state => state.reducer.user?.user?.email?.toLowerCase() === WHATSAPP_DEMO_EMAIL
        ) === true;
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const BusinessProfile = async (
        setIsPurchased: (isPurchased: boolean) => void
    ): Promise<boolean> => {
        // Demo account: skip business profile creation and show the subscription landing page
        if (isDemoAccount) {
            setIsPurchased(false);
            return true;
        }

        setIsLoading(true);

        const response = await createBusinessProfile({
            userId: id,
            userType: role,
        });

        setIsLoading(false);

        if (response) {
            if (response.data.projectId) {
                setIsPurchased(true);
            } else {
                setIsPurchased(false);
            }
            return true;
        }

        navigate(paths.dashboard.serviceNotAvailable);
        return false;
    };
    return { BusinessProfile, isLoading };
}
