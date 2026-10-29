import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

const useServiceAccess = (accessKey: string | string[]) => {
    const { services } = useAppSelector(state => state.reducer.subscriptions);
    const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        if (services && Array.isArray(services.userAccessibleServices)) {
            // setHasAccess(services.userAccessibleServices.includes(accessKey));
            if (typeof accessKey === 'string') {
                setHasAccess(services.userAccessibleServices.includes(accessKey));
            } else if (Array.isArray(accessKey)) {
                setHasAccess(accessKey.some(key => services.userAccessibleServices.includes(key)));
            }
        } else {
            setHasAccess(false);
        }
    }, [services, accessKey]);

    return hasAccess;
};

export default useServiceAccess;
