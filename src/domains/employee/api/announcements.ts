import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';

export interface AnnouncementApiItem {
    id?: string;
    _id?: string;
    subject: string;
    details: string;
    createdAt: string;
}

interface AnnouncementsQuery {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const getMyAnnouncements = async (
    scope: OnboardingScope,
    query: AnnouncementsQuery = {}
): Promise<AnnouncementApiItem[]> => {
    try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.append(key, String(value));
        });
        const qs = params.toString() ? `?${params.toString()}` : '';

        const resp: SuccessGenericResponse<{ announcements: AnnouncementApiItem[]; total: number }> =
            await ApiClient.get(`${base(scope)}/announcements${qs}`);
        return resp.data.announcements;
    } catch (err) {
        return [];
    }
};
