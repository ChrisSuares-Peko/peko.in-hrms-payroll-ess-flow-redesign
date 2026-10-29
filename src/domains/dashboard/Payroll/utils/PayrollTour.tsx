import { Typography, TourProps } from 'antd/lib';

export const getTourSteps = (
    activeEmployessRef: React.RefObject<HTMLElement>,
    totalSalaryRef: React.RefObject<HTMLElement>,
    nextMonthSpendsRef: React.RefObject<HTMLElement>,
    employeesRef: React.RefObject<HTMLElement>,
    salaryRef: React.RefObject<HTMLElement>,
    leavesRef: React.RefObject<HTMLElement>,
    announcementsRef: React.RefObject<HTMLElement>,
    reimbursementRef: React.RefObject<HTMLElement>,
    documentRef: React.RefObject<HTMLElement>,
    processSalaryRef: React.RefObject<HTMLElement>,
    addEmployeeRef: React.RefObject<HTMLElement>,
    addLeaveRef: React.RefObject<HTMLElement>,
    hrSettingsRef: React.RefObject<HTMLElement>,
    viewCalendarRef: React.RefObject<HTMLElement>,
    chartRef: React.RefObject<HTMLElement>
): TourProps['steps'] => [
    {
        title: 'Welcome to Peko’s Payroll',
        placement: 'center',
        description: (
            <Typography.Text className="font-thin text-white">
                Manage your employee’s personal and salary details.
            </Typography.Text>
        ),
    },
    {
        title: 'Active Employees',
        description: (
            <Typography.Text className="font-thin text-white">
                Get a quick snapshot of your employees.
            </Typography.Text>
        ),
        target: () => activeEmployessRef.current as HTMLElement,
    },
    {
        title: 'Total Salary',
        description: (
            <Typography.Text className="font-thin text-white">
                Gain insight into your organization&apos;s salary expenditures.
            </Typography.Text>
        ),
        target: () => totalSalaryRef.current as HTMLElement,
    },
    {
        title: 'Next Month Salary',
        description: (
            <Typography.Text className="font-thin text-white">
                Plan for upcoming payments.
            </Typography.Text>
        ),
        target: () => nextMonthSpendsRef.current as HTMLElement,
    },
    {
        title: 'Employees',
        description: (
            <Typography.Text className="font-thin text-white">
                Dive into detailed employee information.
            </Typography.Text>
        ),
        target: () => employeesRef.current as HTMLElement,
    },
    {
        title: 'Salary',
        description: (
            <Typography.Text className="font-thin text-white">
                View individual salary details.
            </Typography.Text>
        ),
        target: () => salaryRef.current as HTMLElement,
    },
    {
        title: 'Leaves',
        description: (
            <Typography.Text className="font-thin text-white">
                Manage and track employee leave requests.
            </Typography.Text>
        ),
        target: () => leavesRef.current as HTMLElement,
    },
    {
        title: 'Announcements',
        description: (
            <Typography.Text className="font-thin text-white">
                Create new announcements and send it to your employees.
            </Typography.Text>
        ),
        target: () => announcementsRef.current as HTMLElement,
    },
    {
        title: 'Reimbursement',
        description: (
            <Typography.Text className="font-thin text-white">
                Track employee reimbursement requests.
            </Typography.Text>
        ),
        target: () => reimbursementRef.current as HTMLElement,
    },
    {
        title: 'Documents and Assets',
        description: (
            <Typography.Text className="font-thin text-white">
                Access important employee documents.
            </Typography.Text>
        ),
        target: () => documentRef.current as HTMLElement,
    },
    {
        title: 'Process Salary',
        description: (
            <Typography.Text className="font-thin text-white">
                Streamline your payroll process.
            </Typography.Text>
        ),
        target: () => processSalaryRef.current as HTMLElement,
        placement: 'top',
    },
    {
        title: 'Add Employee',
        description: (
            <Typography.Text className="font-thin text-white">
                Easily onboard new team members.
            </Typography.Text>
        ),
        target: () => addEmployeeRef.current as HTMLElement,
        placement: 'top',
    },
    {
        title: 'Add Leave',
        description: (
            <Typography.Text className="font-thin text-white">
                Manage employee leave requests effectively.
            </Typography.Text>
        ),
        target: () => addLeaveRef.current as HTMLElement,
        placement: 'top',
    },
    {
        title: 'HR Settings',
        description: (
            <Typography.Text className="font-thin text-white">
                Manage your HR Settings here.
            </Typography.Text>
        ),
        target: () => hrSettingsRef.current as HTMLElement,
        placement: 'top',
    },
    {
        title: 'View Calendar',
        description: (
            <Typography.Text className="font-thin text-white">
                Stay organized with holidays and events.
            </Typography.Text>
        ),
        target: () => viewCalendarRef.current as HTMLElement,
    },
    {
        title: 'Payroll Graph',
        description: (
            <Typography.Text className="font-thin text-white">
                View your monthly salary expenditures here.
            </Typography.Text>
        ),
        target: () => chartRef.current as HTMLElement,
        placement: 'top',
    },
];
