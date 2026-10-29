import { paths } from '@src/routes/paths';

import AllIcon from '../assets/icons/allIcon.svg';
import BankAccountsIcon from '../assets/icons/companyDocuments.svg';
import BillPaymentsIcon from '../assets/icons/downloadPayslip.svg';
import leaveIcon from '../assets/icons/leaveIcon.svg'
import ReportsIcon from '../assets/icons/reportIcon.svg'

export const quickActions = [
    {
        key: 'add-bill',
        label: 'Add Bill',
        icon: BillPaymentsIcon,
        route: paths.dashboard.billPayments,
        title:"Add Bill"
    },
    {
        key: 'all-payouts',
        label: 'All Payouts',
        icon: AllIcon,
        route: '/payouts/all-payouts',
        title:"All Payouts"
    },
    {
        key: 'add-beneficiary',
        label: 'Add Beneficiary',
        icon: leaveIcon,
        route: `${paths.dashboard.billPayments}/add-beneficiary`,
        title:"Add Beneficiary"
    },
    {
        key: 'manage-beneficiaries',
        label: 'Manage Beneficiaries',
        icon: BankAccountsIcon,
        route: `${paths.dashboard.billPayments}/beneficiaries`,
        title:"Manage Beneficiaries"
    },
    {
        key: 'bank-accounts',
        label: 'Bank Accounts',
        icon: ReportsIcon,
        route: paths.dashboard.profile,
        title:"Bank Accounts"
    },
];

export const recentPayouts = [
    {
        key: 1,
        name: 'Reliance Energy',
        category: 'Utilities',
        date: '10 Mar 2026',
        amount: '₹12,450.00',
        status: 'Completed',
    },
    {
        key: 2,
        name: 'Reliance Energy',
        category: 'Utilities',
        date: '10 Mar 2026',
        amount: '₹12,450.00',
        status: 'Completed',
    },
    {
        key: 3,
        name: 'Reliance Energy',
        category: 'Utilities',
        date: '10 Mar 2026',
        amount: '₹12,450.00',
        status: 'Completed',
    },
    {
        key: 4,
        name: 'Reliance Energy',
        category: 'Utilities',
        date: '10 Mar 2026',
        amount: '₹12,450.00',
        status: 'Completed',
    },
    {
        key: 5,
        name: 'Reliance Energy',
        category: 'Utilities',
        date: '10 Mar 2026',
        amount: '₹12,450.00',
        status: 'Completed',
    },
    {
        key: 6,
        name: 'Reliance Energy',
        category: 'Utilities',
        date: '10 Mar 2026',
        amount: '₹12,450.00',
        status: 'Completed',
    },
];

export const vendorOptions = [
    { label: 'Global Enterprises LLC', value: 'global_enterprises' },
    { label: 'Acme Corp', value: 'acme_corp' },
    { label: 'Tech Solutions', value: 'tech_solutions' },
    { label: 'Innovative Designs', value: 'innovative_designs' },
];

export const currencyOptions = [
    { label: 'INR - Indian Rupee', value: 'INR' },
    { label: 'USD - US Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
];

export const accountTypeOptions = [
    { label: 'Current', value: 'current' },
    { label: 'Savings', value: 'savings' },
    { label: 'Overdraft', value: 'overdraft' },
];

export const addFormLabels: Record<string, string> = {
    domestic: 'Add Domestic Account',
    virtual: 'Add Virtual Account',
    escrow: 'Add Escrow Account',
};

export const addFormSubtitles: Record<string, string> = {
    domestic: 'Enter your domestic bank account details for INR transactions',
    virtual: 'Add a virtual account for automated collections',
    escrow: 'Add an escrow account for secured transactions',
};
