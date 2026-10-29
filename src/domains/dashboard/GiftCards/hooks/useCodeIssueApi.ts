import { useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCodeIssue } from '../api/index';
import { CodeIssueResponse } from '../types/types';

export default function useGetCodeIssue() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
   
    const getCodeData = useCallback(
        async (giftCardID: string) => {
            const data: CodeIssueResponse | false = await getCodeIssue({
                userId: id,
                userType: role,
                cardID: giftCardID,
            });
            if (data) {
              
                return data as CodeIssueResponse;
            }
          
            return null;
        },
        [id, role]
    );

    return getCodeData;
}
