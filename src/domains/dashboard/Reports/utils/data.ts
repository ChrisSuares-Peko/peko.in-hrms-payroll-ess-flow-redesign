import { filterOption } from '@domains/dashboard/Reports/types/index';

export const schedulerTitles = ['Daily Scheduler', 'Weekly Scheduler', 'Montly Scheduler'];

export const filterOptions: filterOption[] = [
    {
        value: 'all',
        label: 'All',
    },
];

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
