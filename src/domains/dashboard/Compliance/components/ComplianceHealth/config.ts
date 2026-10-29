import iconCalendarPurple from '../../assets/icons/icon-calendar-purple.svg';
import iconInfoCircleAmber from '../../assets/icons/icon-info-circle-amber.svg';
import iconTickCircleGreen from '../../assets/icons/icon-tick-circle-green.svg';
import { type ComplianceCardType, type ComplianceStatusType } from '../../utils/data';

export const cardConfig: Record<ComplianceCardType, { headerBg: string; iconBg: string; iconBorder: string; icon: string }> = {
    pending: {
        headerBg: '#fffae8',
        iconBg: '#fff',
        iconBorder: '#fff3de',
        icon: iconInfoCircleAmber,
    },
    recurring: {
        headerBg: '#f9f4fd',
        iconBg: '#fff',
        iconBorder: '#e7ecf9',
        icon: iconCalendarPurple,
    },
    completed: {
        headerBg: '#ecfff1',
        iconBg: '#fff',
        iconBorder: '#d4fae1',
        icon: iconTickCircleGreen,
    },
};

export const statusBadgeConfig: Record<ComplianceStatusType, { bg: string; border: string; text: string }> = {
    overdue:    { bg: '#fff',    border: '#f59e0b', text: '#f59e0b' },
    upcoming:   { bg: '#fff',    border: '#6d71d5', text: '#6d71d5' },
    completed:  { bg: '#ecfdf5', border: '#43b75d', text: '#43b75d' },
    processing: { bg: '#fff',    border: '#6d71d5', text: '#6d71d5' },
};
