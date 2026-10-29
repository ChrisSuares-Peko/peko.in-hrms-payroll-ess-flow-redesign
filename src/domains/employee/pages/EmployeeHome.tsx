import { Flex, Spin } from 'antd';
import { Navigate } from 'react-router-dom';

import {
    EMPLOYEE_MODE_LANDING_ROUTE,
    holdsCardMembership,
    holdsPayrollMembership,
} from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import Dashboard from './Dashboard';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';

// Entry point for the ESS portal: onboarding gate, then the employee dashboard.
const EmployeeHome = () => {
    const { role, employeeProfileId, serviceMemberships } = useAppSelector(
        state => state.reducer.auth
    );
    const { loading, isComplete } = useOnboardingStatus();

    // An employee who holds Corporate Cards but not Payroll has no ESS portal to enter — gating them on
    // payroll onboarding they can never complete is what stranded them on the onboarding screen.
    if (!holdsPayrollMembership(role, serviceMemberships)) {
        if (holdsCardMembership(role, employeeProfileId, serviceMemberships)) {
            return <Navigate to={EMPLOYEE_MODE_LANDING_ROUTE} replace />;
        }
    }

    if (loading) {
        return (
            <Flex align="center" justify="center" className="py-24">
                <Spin size="large" />
            </Flex>
        );
    }

    if (!isComplete) {
        return <Navigate to={paths.employee.onboarding} replace />;
    }

    return <Dashboard />;
};

export default EmployeeHome;
