import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getComplianceListApi } from '../api';
import { ComplianceItem } from '../types';

export interface PriorityActionItem {
    id: number;
    title: string;
    complianceType: string;
    due: string;
    daysLeft: string;
    isHighPriority: boolean;
}

const formatDue = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const computeDaysLeft = (dueDate: string): { label: string; isOverdue: boolean } => {
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return { label: `${Math.abs(diff)} days overdue`, isOverdue: true };
    if (diff === 0) return { label: 'Due today', isOverdue: true };
    return { label: `${diff} days left`, isOverdue: false };
};

const toAction = (item: ComplianceItem): PriorityActionItem => {
    const { label, isOverdue } = item.dueDate
        ? computeDaysLeft(item.dueDate)
        : { label: 'No due date', isOverdue: false };

    return {
        id: item.id,
        title: item.title,
        complianceType: item.complianceType,
        due: item.dueDate ? formatDue(item.dueDate) : '—',
        daysLeft: label,
        isHighPriority: isOverdue,
    };
};

export const useCompliancePriorityActions = () => {
    const { id: userId, role: userType } = useAppSelector((state) => state.reducer.auth);
    const [actions, setActions] = useState<PriorityActionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActions = useCallback(async () => {
        setIsLoading(true);
        const response = await getComplianceListApi({
            userId: Number(userId),
            userType,
            page: 1,
            pageSize: 5,
            searchText: '',
            from: '',
            to: '',
            status: 'pending',
        });
        if (response) {
            setActions(response.rows.map(toAction));
        }
        setIsLoading(false);
    }, [userId, userType]);

    useEffect(() => {
        fetchActions();
    }, [fetchActions]);

    return { actions, isLoading };
};
