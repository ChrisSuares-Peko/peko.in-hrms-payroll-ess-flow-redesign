import { Flex, Spin } from 'antd';
import { Navigate } from 'react-router-dom';

import {
    EMPLOYEE_MODE_LANDING_ROUTE,
    holdsCardMembership,
    holdsPayrollMembership,
} from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { useEssAuth, useEssPath } from '@src/prototype/essSession';
import { paths } from '@src/routes/paths';

import Dashboard from './Dashboard';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';

// Entry point for the ESS portal: onboarding gate, then the employee dashboard.
const EmployeeHome = () => {
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, employeeProfileId, serviceMemberships } = useEssAuth();
    const { loading, isComplete } = useOnboardingStatus();
    // PROTOTYPE-SETUP: map /employee links to where the page is mounted (/ess in the prototype).
    const essPath = useEssPath();

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
        return <Navigate to={essPath(paths.employee.onboarding)} replace />;
    }

    return <Dashboard />;
};

export default EmployeeHome;
