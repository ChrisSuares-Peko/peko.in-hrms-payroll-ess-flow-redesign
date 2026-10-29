import { Suspense } from 'react';

import { Navigate, Outlet } from 'react-router-dom';

import EmployeePortalLayout from '@layouts/EmployeePortalLayout';
import { paths } from '@routes/paths';
import CorporateCardsPage from '@src/domains/dashboard/corporateCards/pages/CorporateCardsPage';
import Attendance from '@src/domains/employee/pages/Attendance';
import Documents from '@src/domains/employee/pages/Documents';
import EmployeeHome from '@src/domains/employee/pages/EmployeeHome';
import EmployeeOnboarding from '@src/domains/employee/pages/EmployeeOnboarding';
import Leaves from '@src/domains/employee/pages/Leaves';
import Payslips from '@src/domains/employee/pages/Payslips';
import Profile from '@src/domains/employee/pages/Profile';
import Reimbursements from '@src/domains/employee/pages/Reimbursements';
import AuthGuard from '@src/guard/AuthGuard';
import EmployeeAuthGuard from '@src/guard/EmployeeAuthGuard';

export const employeeRoutes = [
    {
        path: '',
        element: (
            <AuthGuard>
                <EmployeeAuthGuard>
                    <EmployeePortalLayout>
                        <Suspense>
                            <Outlet />
                        </Suspense>
                    </EmployeePortalLayout>
                </EmployeeAuthGuard>
            </AuthGuard>
        ),
        children: [
            { element: <Navigate to={paths.employee.home} replace />, index: true },
            { element: <EmployeeHome />, path: paths.employee.home },
            { element: <EmployeeOnboarding />, path: paths.employee.onboarding },
            { element: <Profile />, path: paths.employee.profile },
            { element: <Attendance />, path: paths.employee.attendance },
            { element: <Payslips />, path: paths.employee.payslips },
            { element: <Leaves />, path: paths.employee.leaves },
            { element: <Reimbursements />, path: paths.employee.reimbursements },
            { element: <Documents />, path: paths.employee.documents },
            { element: <CorporateCardsPage />, path: paths.employee.corporateCard },
        ],
    },
];
