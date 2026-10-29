import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getLatestVehicleUsage } from '../../api/fleet';
import { LatestVehicleDetailsResponse } from '../../types/fleetManagement/index';

export default function GetLatestVehicleUsage(fleetId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [usageDetails, setUsageDetails] = useState<LatestVehicleDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getUsageDetails = useCallback(async () => {
        const data: LatestVehicleDetailsResponse | false = await getLatestVehicleUsage({
            userId: id,
            userType: role,
            fleetId,
        });
        if (data) {
            const assetDetailData = data as LatestVehicleDetailsResponse;
            setUsageDetails(assetDetailData);
            setIsLoading(false);
        } else {
            navigate(`/${paths.pekoCloud.index}`);
            dispatch(
                showToast({
                    description: 'Asset not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [dispatch, fleetId, id, navigate, role]);

    useEffect(() => {
        getUsageDetails();
    }, [getUsageDetails]);

    return { usageDetails, loader: isLoading, getUsageDetails };
}
