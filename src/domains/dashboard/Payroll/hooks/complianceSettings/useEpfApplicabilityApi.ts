import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getEpfApplicabilityApi,
    updateEpfApplicabilityApi,
    updateEpfEarningsLineApi,
} from '../../api/complianceSettings/index';
import { EpfApplicability } from '../../types/complianceSettings/complianceSettingsType';

// Compliance Settings > EPF > "EPF applies to this establishment" — the current setting
// plus the headcount/payroll context the switch needs (who can turn it off, and from which
// payroll month a flip takes effect).
export default function useEpfApplicabilityApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [applicability, setApplicability] = useState<EpfApplicability>();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [updatingEarningsLine, setUpdatingEarningsLine] = useState(false);

    const fetchApplicability = useCallback(async () => {
        setLoading(true);
        const response = await getEpfApplicabilityApi({ userId: id, userType: role });
        if (response.success && response.data) setApplicability(response.data);
        setLoading(false);
    }, [id, role]);

    useEffect(() => {
        if (id && role) fetchApplicability();
    }, [id, role, fetchApplicability]);

    const updateApplicability = async (isApplicable: boolean) => {
        setUpdating(true);
        const response = await updateEpfApplicabilityApi({ isApplicable, userId: id, userType: role });
        setUpdating(false);

        if (response.success && response.data) {
            setApplicability(response.data);
            dispatch(
                showToast({
                    description: response.message || 'EPF applicability updated',
                    variant: 'success',
                })
            );
            return true;
        }
        dispatch(
            showToast({
                description: response.errorMessage || 'Failed to update EPF applicability',
                variant: 'error',
            })
        );
        return false;
    };

    // "Show PF Employee's Contribution in Earnings" — display only.
    const updateEarningsLine = async (showInEarnings: boolean) => {
        setUpdatingEarningsLine(true);
        const response = await updateEpfEarningsLineApi({ showInEarnings, userId: id, userType: role });
        setUpdatingEarningsLine(false);

        if (response.success && response.data) {
            setApplicability(response.data);
            dispatch(showToast({ description: response.message || 'Setting updated', variant: 'success' }));
            return true;
        }
        dispatch(
            showToast({
                description: response.errorMessage || 'Failed to update the PF earnings setting',
                variant: 'error',
            })
        );
        return false;
    };

    return {
        applicability,
        loading,
        updating,
        updateApplicability,
        updatingEarningsLine,
        updateEarningsLine,
        refetch: fetchApplicability,
    };
}
