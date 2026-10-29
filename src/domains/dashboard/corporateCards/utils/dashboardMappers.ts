import dayjs from 'dayjs';

import { DailySpendPoint } from './types';
import { DashboardDailyPoint } from '../api/user/dashboardApi';

export const CATEGORY_COLORS = ['#EF4444', '#2563EB', '#F59E0B', '#10B981', '#7C3AED', '#EC4899'];

export const categoryColor = (index: number): string =>
    CATEGORY_COLORS[index % CATEGORY_COLORS.length];

export const utilisationColor = (percent: number): string => {
    if (percent >= 90) return '#FF4F4F';
    if (percent >= 70) return '#F59E0B';
    return '#43B75D';
};

export const toDailyPoints = (points: DashboardDailyPoint[]): DailySpendPoint[] =>
    points.map(p => ({ label: dayjs(p.date).format('D MMM'), value: p.amount }));
