import { filterOption } from '@src/domains/dashboard/Reports/types';

export const statusData = [
    {
        value: 'PICKUP',
        label: 'Pickup',
    },
    {
        value: 'ASSIGNED',
        label: 'Assigned',
    },
    {
        value: 'PROCESSING',
        label: 'Processing',
    },
    {
        value: 'DISPATCHED',
        label: 'Dispatched',
    },
    {
        value: 'COMPLETED',
        label: 'Completed',
    },
];

export const WorkOptions = [
    { value: 'PENDING', label: 'Pending' },
    // { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'ONPROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    // { value: 'CANCELLED', label: 'Cancelled' },
];

export const schedulerTitles = ['Daily Scheduler', 'Weekly Scheduler', 'Montly Scheduler'];

export const weekDay: filterOption[] = [
    {
        value: '0',
        label: 'Sunday',
    },
    {
        value: '1',
        label: 'Monday',
    },
    {
        value: '2',
        label: 'Tuesday',
    },
    {
        value: '3',
        label: 'Wednesday',
    },
    {
        value: '4',
        label: 'Thursday',
    },
    {
        value: '5',
        label: 'Friday',
    },
    {
        value: '6',
        label: 'Saturday',
    },
];
