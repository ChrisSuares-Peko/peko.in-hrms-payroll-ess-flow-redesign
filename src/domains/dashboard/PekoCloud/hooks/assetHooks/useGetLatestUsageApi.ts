import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getLatestAssetUsage } from '../../api/assets';
import { LatestAssetUsageResponse } from '../../types/assets/index';

export default function GetLatestAssetUsage(assetId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [usageDetails, setUsageDetails] = useState<LatestAssetUsageResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getUsageDetails = useCallback(async () => {
        const data: LatestAssetUsageResponse | false = await getLatestAssetUsage({
            userId: id,
            userType: role,
            assetId,
        });
        if (data) {
            const assetDetailData = data as LatestAssetUsageResponse;
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
    }, [assetId, dispatch, id, navigate, role]);

    useEffect(() => {
        getUsageDetails();
    }, [getUsageDetails]);

    return { usageDetails, loader: isLoading, getUsageDetails };
}
