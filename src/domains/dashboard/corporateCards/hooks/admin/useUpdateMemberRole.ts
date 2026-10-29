import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { CardMemberEdit, updateCardMember } from '../../api/user/cardMembersApi';

/**
 * Change a member's editable details.
 *
 * Only a success toast is raised here: ApiClient already surfaces the server's message for any responseCode
 * other than '003', so the real reasons a change is refused — an invalid role, or changing your own — are
 * reported once rather than twice.
 */
export const useUpdateMemberRole = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const submitRole = async (userId: number, changes: CardMemberEdit) => {
        if (!Object.keys(changes).length) return true;

        setIsLoading(true);
        const res = await updateCardMember(userId, changes);
        setIsLoading(false);
        if (!res) return false;
        dispatch(showToast({ variant: 'success', description: 'Member updated.' }));
        return true;
    };

    return { submitRole, isLoading };
};
