import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { generateEmbeddedSignupURL } from '../api/index';
import { GenerateURLResponse } from '../types/types';

export function useGenerateEmbeddedSignupURL() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const generateURL = async (projectId: string): Promise<GenerateURLResponse | false> => {
        setIsLoading(true);

        const response = await generateEmbeddedSignupURL({
            userId: id,
            userType: role,
            id: projectId,
        });

        setIsLoading(false);
        return response;
    };

    return { generateURL, isLoading };
}
