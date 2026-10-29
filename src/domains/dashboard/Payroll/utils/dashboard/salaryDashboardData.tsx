import generateReportsImg from '@src/domains/dashboard/Payroll/assets/images/generatereports.png';
import lastMonthImg from '@src/domains/dashboard/Payroll/assets/images/lastmonth.png';
import manageBanksImg from '@src/domains/dashboard/Payroll/assets/images/managebanks.png';
import monthDueImg from '@src/domains/dashboard/Payroll/assets/images/monthdue.png';
import payrollEmpImg from '@src/domains/dashboard/Payroll/assets/images/payrollEmp.png';
import primaryAccountImg from '@src/domains/dashboard/Payroll/assets/images/primaryaccount.png';
import processSalImg from '@src/domains/dashboard/Payroll/assets/images/processSal.png';
import salaryHistoryImg from '@src/domains/dashboard/Payroll/assets/images/salaryhistory.png';
import salaryStatsImg from '@src/domains/dashboard/Payroll/assets/images/salarystats.png';

export const statCards = [
    {
        bg: '#FDF6F0',
        icon: <img src={monthDueImg} alt="Current Month Due" style={{ width: 24, height: 24, objectFit: 'contain' }} />,
        label: 'Current Month Due',
        value: '₹3,67,000',
    },
    {
        bg: '#ECF0FC',
        icon: <img src={lastMonthImg} alt="Last Month Rolled Out" style={{ width: 24, height: 24, objectFit: 'contain' }} />,
        label: 'Last Month Rolled Out',
        value: '₹3,67,000',
    },
    {
        bg: '#EBF6F1',
        icon: <img src={primaryAccountImg} alt="Virtual Account balance" style={{ width: 24, height: 24, objectFit: 'contain' }} />,
        label: 'Virtual Account balance',
        value: '₹3,67,000',
    },
];

export const quickAccessItems = [
    { icon: <img src={payrollEmpImg} alt="Payroll Employees" style={{ width: 42, height: 42, objectFit: 'contain' }} />, label: 'Payroll\nEmployees', path: 'salaryEmployees' },
    { icon: <img src={processSalImg} alt="Process Salary" style={{ width: 42, height: 42, objectFit: 'contain' }} />, label: 'Process Salary', path: 'salaryProcess' },
    { icon: <img src={salaryHistoryImg} alt="Salary History" style={{ width: 42, height: 42, objectFit: 'contain' }} />, label: 'Salary History', path: 'salaryHistory' },
    { icon: <img src={salaryStatsImg} alt="Salary Stats" style={{ width: 42, height: 42, objectFit: 'contain' }} />, label: 'Salary Stats', path: 'salaryStats' },
    { icon: <img src={manageBanksImg} alt="Manage Banks" style={{ width: 42, height: 42, objectFit: 'contain' }} />, label: 'Manage Banks', path: 'manageBanks' },
    { icon: <img src={generateReportsImg} alt="Generate Reports" style={{ width: 42, height: 42, objectFit: 'contain' }} />, label: 'Generate\nReports', path: '', comingSoon: true },
];
