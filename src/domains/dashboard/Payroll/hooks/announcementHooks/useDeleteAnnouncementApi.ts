import { useState, useCallback } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteAnnouncement } from '../../api/announcementApi';
import { announcementDeleteResponse } from '../../types/dashboardTypes';

interface useAnnouncementApiProps {
    handleCancel?: () => void;
}
export const useDeleteAnnouncementApi = ({ handleCancel }: useAnnouncementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isSuccess, setIsSuccess] = useState(false);

    const deleteAnnouncementData = useCallback(
        async (announcementId: string) => {
            setIsSuccess(false);
            const data: announcementDeleteResponse | false = await deleteAnnouncement({
                userId: id,
                userType: role,
                announcementId,
            });
            if (data && handleCancel) {
                handleCancel();
                return true;
            }
            return false;
        },
        [handleCancel, id, role]
    );
    return { deleteAnnouncementData, success: isSuccess };
};
