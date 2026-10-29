// PROTOTYPE-SETUP: the employee portal pages (src/domains/employee) mounted at /ess/* inside the corporate
// dashboard layout. The original /employee routes (employee.tsx) are untouched.
import { lazy } from 'react';

import EssPrototypeLayout from '@src/prototype/ess/EssPrototypeLayout';

const EmployeeHome = lazy(() => import('@src/domains/employee/pages/EmployeeHome'));
const Profile = lazy(() => import('@src/domains/employee/pages/Profile'));
const Attendance = lazy(() => import('@src/domains/employee/pages/Attendance'));
const Payslips = lazy(() => import('@src/domains/employee/pages/Payslips'));
const Leaves = lazy(() => import('@src/domains/employee/pages/Leaves'));
const Reimbursements = lazy(() => import('@src/domains/employee/pages/Reimbursements'));
const Documents = lazy(() => import('@src/domains/employee/pages/Documents'));

export const essRoutes = [
    {
        element: <EssPrototypeLayout />,
        children: [
            { element: <EmployeeHome />, index: true },
            { element: <Profile />, path: 'profile' },
            { element: <Attendance />, path: 'attendance' },
            { element: <Payslips />, path: 'payslips' },
            { element: <Leaves />, path: 'leaves' },
            { element: <Reimbursements />, path: 'reimbursements' },
            { element: <Documents />, path: 'documents' },
        ],
    },
];
