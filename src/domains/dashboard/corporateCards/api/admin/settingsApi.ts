import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface NotificationControls {
    requireReceipts: boolean;
    autoDeclineOverLimit: boolean;
    notifyPendingKyc: boolean;
    weeklySpendDigest: boolean;
}

export type NotificationControlKey = keyof NotificationControls;

const controlsPath = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/settings/notification-controls`;

export const getNotificationControls = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<{ notificationControls: NotificationControls }> =
            await ApiClient.get(controlsPath(userType, userId));
        return res;
    } catch (error) {
        return false;
    }
};

export const updateNotificationControls = async (
    userType: string,
    userId: number,
    change: Partial<NotificationControls>
) => {
    try {
        const res: SuccessGenericResponse<{ notificationControls: NotificationControls }> =
            await ApiClient.put(controlsPath(userType, userId), change);
        return res;
    } catch (error) {
        return false;
    }
};
