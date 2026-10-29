import { useCallback, useEffect, useState } from 'react';

// import { commonSelectType } from '@customtypes/general';
import { commonSelectType, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createNotification, getAllCorporates, putUpdateNotification } from '../api/index';
import { CorporateListResponse, NotificationData, NotificationDataWithoutId } from '../types/index';

export default function useNotificationUpdate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<NotificationData | {}>();
    const [corporates, setCorporateList] = useState<commonSelectType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleNotificationCreation = async (payload: NotificationDataWithoutId) => {
        setIsLoading(true);
        const response: false | SuccessGenericResponse<NotificationData> = await createNotification(
            {
                ...payload,
                userId: id,
                userType: role,
            }
        );

        setResponseData(response);
        setIsLoading(false);
        return response;
    };

    const updateNotificationDetails = useCallback(
        async (vendorUpdatedData: NotificationData) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<NotificationData> | false =
                await putUpdateNotification({
                    userId: id,
                    userType: role,
                    ...vendorUpdatedData,
                });
            setResponseData(response);
            setIsLoading(false);
            return response;
        },
        [id, role]
    );

    const getCorporateList = useCallback(async () => {
        setIsLoading(true);
        const data: CorporateListResponse | false = await getAllCorporates({
            userId: id,
            userType: role,
            searchText: '',
        });
        setIsLoading(false);
        if (data) {
            const { result } = data;
            const arr = result.map(corporate => ({
                oName: `${corporate.name} ${corporate?.username}`,
                oValue: corporate.username,
            }));

            setCorporateList(arr);
        }
    }, [id, role]);

    useEffect(() => {
        getCorporateList();
    }, [getCorporateList]);

    return {
        handleNotificationCreation,
        responseData,
        isLoading,
        updateNotificationDetails,
        corporates,
    };
}
