import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProfileUpdateRequests } from '../../api/profileUpdateRequestApi';
import type { ProfileUpdateRecord } from '../../components/Employees/ProfileUpdateRequestTab';

const AVATAR_PALETTE = [
    { bg: '#FFF5F5', text: '#FF9F9F' },
    { bg: '#F0F5FF', text: '#ADC6FF' },
    { bg: '#F6FFED', text: '#52C41A' },
    { bg: '#FFF0F6', text: '#FF85C2' },
    { bg: '#F9F0FF', text: '#B37FEB' },
    { bg: '#FFF7E6', text: '#FFA940' },
];

const getInitials = (name: string): string =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('') || '—';

const toStatusLabel = (status?: string): ProfileUpdateRecord['status'] => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return 'Approved';
        case 'rejected':
            return 'Rejected';
        default:
            return 'Pending';
    }
};

const FIELD_LABELS: Record<string, string> = {
    mobileNumber: 'Mobile Number',
    addressLine1: 'Address Line 1',
    addressLine2: 'Address Line 2',
    state: 'State',
    country: 'Country',
    pinCode: 'Pin Code',
    emergencyContactName: 'Emergency Contact Name',
    emergencyContactPhone: 'Emergency Contact Phone',
    bankName: 'Bank Name',
    ifscCode: 'IFSC Code',
    accountNumber: 'Account Number',
};

const formatFieldLabel = (key: string): string =>
    FIELD_LABELS[key] ??
    key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, char => char.toUpperCase())
        .trim();

const toDisplayValue = (value: string | number | null | undefined): string =>
    value === null || value === undefined || value === '' ? '—' : String(value);

const buildChanges = (
    requested?: Record<string, string | number | null>,
    current?: Record<string, string | number | null>
) => {
    const keys = Array.from(new Set([...Object.keys(requested ?? {}), ...Object.keys(current ?? {})]));
    return keys
        .map(key => ({
            field: formatFieldLabel(key),
            current: toDisplayValue(current?.[key]),
            requested: toDisplayValue(requested?.[key]),
        }))
        .filter(change => change.current !== change.requested);
};

export const useGetProfileUpdateRequestsApi = (
    page: number,
    limit: number,
    searchText: string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [requestData, setRequestData] = useState<ProfileUpdateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [pendingCount, setPendingCount] = useState<number>(0);

    const getRequests = useCallback(async () => {
        setIsLoading(true);
        const data = await getProfileUpdateRequests({ userType: role, userId: id, page, limit, searchText });
        if (data) {
            const arr: ProfileUpdateRecord[] = (data?.records ?? []).map((item, index) => {
                const name = item?.employee?.fullName ?? '';
                const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
                const isBank = (item?.type ?? '').toLowerCase().includes('bank');
                const changes = buildChanges(item?.requestedData, item?.currentData);
                return {
                    key: item?.id ?? String(index),
                    name,
                    email: '',
                    initials: getInitials(name),
                    avatarBg: palette.bg,
                    avatarTextColor: palette.text,
                    employeeId: item?.employee?.employeeId ?? '',
                    designation: item?.employee?.designation ?? '',
                    employmentType: '',
                    updateType: isBank ? 'Bank' : 'Profile',
                    status: toStatusLabel(item?.status),
                    profileChanges: isBank ? [] : changes,
                    bankChanges: isBank ? changes : [],
                };
            });
            setRequestData(arr);
            setCount(data?.total ?? 0);
            setPendingCount(data?.pendingCount ?? 0);
        }
        setIsLoading(false);
    }, [id, role, page, limit, searchText]);

    useEffect(() => {
        getRequests();
    }, [getRequests, reloadTable]);

    return { requestData, requestLoading: isLoading, requestTotal: count, pendingCount };
};
