import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAccountingServiceCommissionModes } from '../api/services';
import { CommissionMode } from '../types/services';
import { COMMISSION_MODE_OPTIONS } from '../utils/serviceDetailData';

const DEFAULT_MODES: CommissionMode[] = ['MARGIN'];

// The commission modes a service supports, as select options. A service that is not marked as supporting
// markup (or whose modes could not be loaded) is Margin only.
export default function useCommissionModes(accessKey: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [modes, setModes] = useState<CommissionMode[]>(DEFAULT_MODES);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            const data = accessKey
                ? await getAccountingServiceCommissionModes({
                      userId: id,
                      userType: role,
                      accessKey,
                  })
                : false;
            if (!active) return;
            setModes(data ? data.commissionModes : DEFAULT_MODES);
            setIsLoading(false);
        };
        load();
        return () => {
            active = false;
        };
    }, [id, role, accessKey]);

    const options = COMMISSION_MODE_OPTIONS.filter(option => modes.includes(option.value));
    return { options, isLoading };
}
