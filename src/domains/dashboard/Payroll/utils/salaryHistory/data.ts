
import SalaryHistoryCoin from '@src/domains/dashboard/Payroll/assets/icons/salaryHistoryCoin.svg';
import SalaryHistoryProcessEmployee from '@src/domains/dashboard/Payroll/assets/icons/salaryHistoryProcessEmployee.svg';

import { DetailRecord } from './columns';

export type { DetailRecord };

export const mockDetailData: DetailRecord[] = [
    { key: '1', empId: '24454', name: 'Ravi Kumar', email: 'ravi@example.com', accountPrimary: 'HDFC – XXXX1234', accountLabel: 'Account No.', transType: 'NEFT', grossSalary: 85000, deduction: 12750, netSalary: 72250, status: 'Paid', oneTimePayments: [] },
    { key: '2', empId: '23454', name: 'Priya Sharma', email: 'priya@example.com', accountPrimary: 'priya@oksbi', accountLabel: 'UPI ID', transType: 'UPI', grossSalary: 62000, deduction: 9300, netSalary: 52700, status: 'Pending', oneTimePayments: [] },
    { key: '3', empId: '43523', name: 'Anjali Mehta', email: 'anjali@example.com', accountPrimary: 'SBI – XXXX9012', accountLabel: 'Account No.', transType: 'IMPS', grossSalary: 74000, deduction: 11100, netSalary: 62900, status: 'Paid', oneTimePayments: [] },
    { key: '4', empId: '43523', name: 'Suresh Pillai', email: 'suresh@example.com', accountPrimary: 'HDFC – XXXX3456', accountLabel: 'Account No.', transType: 'RTGS', grossSalary: 91000, deduction: 13650, netSalary: 77350, status: 'Paid', oneTimePayments: [] },
];

export const statCards = [
    {
        bg: '#FDF6F0',
        icon: SalaryHistoryCoin,
        value: '₹3,11,200',
        label: 'Total Processed',
    },
    {
        bg: '#ECF0FC',
        icon: SalaryHistoryProcessEmployee,
        value: '3 employees',
        label: 'Successfully Paid',
    },
    {
        bg: '#EBF6F1',
        icon: SalaryHistoryProcessEmployee,
        value: '2 employees',
        label: 'Pending Confirmation',
    },
];

export const MONTH_OPTIONS = [
    { value: 'jan', label: 'January' },
    { value: 'feb', label: 'February' },
    { value: 'mar', label: 'March' },
    { value: 'apr', label: 'April' },
    { value: 'may', label: 'May' },
    { value: 'jun', label: 'June' },
    { value: 'jul', label: 'July' },
    { value: 'aug', label: 'August' },
    { value: 'sep', label: 'September' },
    { value: 'oct', label: 'October' },
    { value: 'nov', label: 'November' },
    { value: 'dec', label: 'December' },
];
