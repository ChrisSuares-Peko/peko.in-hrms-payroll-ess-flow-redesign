import { RequestStatus } from './types';

export interface ReimbursementRow {
    key: string;
    date: string;
    merchant: string;
    description: string;
    category: string;
    receipt: boolean;
    status: RequestStatus;
    amount: number;
}

export const REIMBURSEMENT_CATEGORIES = [
    { value: 'Travel', label: 'Travel' },
    { value: 'Office', label: 'Office' },
    { value: 'Meals', label: 'Meals' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Supplies', label: 'Supplies' },
    { value: 'Other', label: 'Other' },
];

export const REIMBURSEMENTS: ReimbursementRow[] = [
    {
        key: '1',
        date: '2024-01-12',
        merchant: 'Auto Rickshaw',
        description: 'Client meeting transport',
        category: 'Travel',
        receipt: true,
        status: 'Approved',
        amount: 2400,
    },
    {
        key: '2',
        date: '2024-02-03',
        merchant: 'Bombay Print Hub',
        description: 'Conference materials',
        category: 'Office',
        receipt: true,
        status: 'Rejected',
        amount: 790.5,
    },
    {
        key: '3',
        date: '2024-03-15',
        merchant: 'Bukhara',
        description: 'Client dinner',
        category: 'Meals',
        receipt: true,
        status: 'Approved',
        amount: 7240.5,
    },
    {
        key: '4',
        date: '2024-04-27',
        merchant: 'Parking Plaza',
        description: 'Off-site meeting parking',
        category: 'Entertainment',
        receipt: true,
        status: 'Pending',
        amount: 5240.5,
    },
    {
        key: '5',
        date: '2024-05-09',
        merchant: 'Gateway Café',
        description: 'Team brainstorming session',
        category: 'Supplies',
        receipt: true,
        status: 'Pending',
        amount: 3150.75,
    },
];
