// useRootPath hook
import { UserRole } from '@customtypes/general';
import {
    EMPLOYEE_MODE_LANDING_ROUTE,
    holdsCardMembership,
} from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

export const useRootPath = () => {
    const { role, employeeProfileId, serviceMemberships } = useAppSelector(
        state => state.reducer.auth
    );

    switch (role) {
        case UserRole.CORPORATE:
            return paths.dashboard.home;
        case UserRole.SYSTEM:
            return paths.systemUser.dashboard;
        case UserRole.EMPLOYEE:
            // An employee who also holds a card membership belongs in the corporate shell: that is the one
            // that fetches the services tree, so it is the only place their sidebar can show both Corporate
            // Cards and Payroll. The ESS portal never loads services, so landing there leaves them with the
            // single hardcoded Payroll item. A payroll-only employee still lands in the ESS portal, unchanged.
            return holdsCardMembership(role, employeeProfileId, serviceMemberships)
                ? EMPLOYEE_MODE_LANDING_ROUTE
                : paths.employee.home;
        default:
            return '/auth/login';
    }
};
