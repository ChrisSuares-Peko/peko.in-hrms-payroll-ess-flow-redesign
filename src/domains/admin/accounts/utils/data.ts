import dayjs from 'dayjs';

export const dateFormat = 'YYYY-MM-DD';
export const disabledDate = (current: any) => current && current > dayjs().endOf('day');

const today = new Date();
export const initialFilters = {
    page: 1,
    itemsPerPage: 10,
    filter: '',
    sort: 'DESC' as 'DESC' | 'ASC',
    corporateId: undefined,
    searchText: '',
    from: today.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
    sortField: '',
};

export const transferTypes = [
    { label: 'Credit', value: 'Credit' },
    { label: 'Debit', value: 'Debit' },
];
