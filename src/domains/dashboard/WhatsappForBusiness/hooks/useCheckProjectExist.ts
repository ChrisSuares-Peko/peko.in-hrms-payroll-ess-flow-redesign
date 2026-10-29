import { useCallback } from 'react';

import { userPayload } from '../../plans/types';
import { checkProjectExist } from '../api/index';

export default function useCheckProjectExist() {
    const checkProject = useCallback(async (payload: userPayload) => {
        const result = await checkProjectExist(payload);
        // Assume result.status indicates project existence
        if (result) {
            return false;
        }
        return true;
    }, []);

    return { checkProject };
}
