import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNewHireEmployees } from '../../api/employeeApi';

export interface NewHireRow {
    key: string;
    id: string;
    name: string;
    email: string;
    initials: string;
    role: string;
    department?: string;
    joinDate: string;
    offerStatus: 'Pending' | 'Signed' | 'Rejected';
    phone: string;
    profileImage?: string;
}

const mapStatus = (status?: string): NewHireRow['offerStatus'] => {
    if (status === 'SIGNED') return 'Signed';
    if (status === 'REJECTED') return 'Rejected';
    return 'Pending';
};

const initialsOf = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');

export function useGetNewHireList(searchText: string, page: number, pageSize = 10) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<NewHireRow[]>([]);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNewHires = useCallback(async () => {
        setIsLoading(true);
        const data = await getNewHireEmployees({
            userId: id,
            userType: role,
            page,
            limit: pageSize,
            searchText,
        });
        if (data) {
            const mapped: NewHireRow[] = (data.rows || []).map((item: any) => {
                const fullName = item.personalInformation?.fullName ?? '';
                return {
                    key: item.id,
                    id: item.id,
                    name: fullName,
                    email: item.personalInformation?.email ?? '',
                    initials: initialsOf(fullName),
                    role: item.employeeInformation?.designation ?? '',
                    department: item.employeeInformation?.department?.departmentName,
                    joinDate: item.employeeInformation?.dateOfJoin ?? '',
                    offerStatus: mapStatus(item.offerLetter?.status),
                    phone: item.personalInformation?.mobileNo ?? '',
                    profileImage: item.profileImage,
                };
            });
            setRows(mapped);
            setCount(data.count || 0);
        }
        setIsLoading(false);
    }, [id, role, page, pageSize, searchText]);

    useEffect(() => {
        fetchNewHires();
    }, [fetchNewHires]);

    return { rows, count, isLoading, pageSize, refetch: fetchNewHires };
}
