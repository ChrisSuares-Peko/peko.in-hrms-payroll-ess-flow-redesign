import SalaryHistoryCoin from '@src/domains/dashboard/Payroll/assets/icons/salaryHistoryCoin.svg';
import SalaryHistoryProcessEmployee from '@src/domains/dashboard/Payroll/assets/icons/salaryHistoryProcessEmployee.svg';

export const payrollHistoryStatCards = [
    {
        bg: '#FDF6F0',
        icon: SalaryHistoryCoin,
        value: '₹0',
        label: 'Total Processed',
    },
    {
        bg: '#ECF0FC',
        icon: SalaryHistoryProcessEmployee,
        value: '0 employees',
        label: 'Successfully Paid',
    },
    {
        bg: '#EBF6F1',
        icon: SalaryHistoryProcessEmployee,
        value: '0 employees',
        label: 'Pending Confirmation',
    },
];
