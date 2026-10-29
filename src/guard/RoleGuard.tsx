import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import AccessDenied from '@src/domains/failed/pages/AccessDenied';
import { checkServiceAccessAndSubServiceAdmin } from '@utils/checkAccess';

type RoleGuardProps = {
    children: React.ReactNode;
};

export default function RoleGuard({ children }: RoleGuardProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const navigate = useNavigate();
    const serviceCategory = window.location.pathname
        .toLocaleLowerCase()
        ?.split('/')[2]
        ?.split('-')
        ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
        ?.join(' ');
    const subService =
        window.location.pathname
            .toLocaleLowerCase()
            ?.split('/')[3]
            ?.split('-')
            ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
            ?.join(' ') || '';
    let hasAccess = false;
    const whitelabeledRoutes = ['profile'];
    // Dashboard drill-down pages with no sidebar entry of their own — access follows Accounting alone.
    const whitelabeledSubRoutes = [
        'bulk',
        'bulk-upload',
        'airline-view',
        'transactions',
        'commission-details',
        'platform-fee-details',
        'other-sales',
        'subscription-details',
        'third-party-sales',
    ];
    if (whitelabeledRoutes.includes(serviceCategory?.toLowerCase())) {
        hasAccess = true;
    } else {
        hasAccess = checkServiceAccessAndSubServiceAdmin(
            serviceCategory,
            subService,
            whitelabeledSubRoutes
        );
    }
    const [grantAccess, setGrantAccess] = useState<any>(null);

    const checkRole = useCallback(() => {
        if (hasAccess) {
            setGrantAccess(true);
        } else setGrantAccess(false);
    }, [hasAccess]);

    useEffect(() => {
        checkRole();
    }, [checkRole]);

    if (!grantAccess && grantAccess !== null) {
        return <AccessDenied />;
    }

    return <>{children}</>;
}
