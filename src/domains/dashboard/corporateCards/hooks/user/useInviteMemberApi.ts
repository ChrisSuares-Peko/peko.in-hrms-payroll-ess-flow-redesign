import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createCardMember, validateCardMember } from '../../api/user/cardMembersApi';

export interface InviteMemberDetails {
    firstName: string;
    lastName: string;
    mobileNo: string;
    email: string;
    department?: string;
    role: string;
}

export const useInviteMemberApi = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Invite a member in one step: validate the details (duplicate email/mobile check) and, if clear,
     * create the member. The member is created as an employee identity with a card role — Corporate Cards
     * has its own invite endpoint and no longer goes through Settings → User Management.
     */
    const submitInvite = async (details: InviteMemberDetails) => {
        setIsLoading(true);
        const base = {
            name: `${details.firstName} ${details.lastName}`.trim(),
            email: details.email,
            mobileNo: details.mobileNo,
            role: details.role,
        };
        try {
            const valid = await validateCardMember(base);
            if (!valid) return false;
            const created = await createCardMember(base);
            if (created) {
                dispatch(
                    showToast({ variant: 'success', description: 'Invitation sent successfully.' })
                );
            }
            return !!created;
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, submitInvite };
};
