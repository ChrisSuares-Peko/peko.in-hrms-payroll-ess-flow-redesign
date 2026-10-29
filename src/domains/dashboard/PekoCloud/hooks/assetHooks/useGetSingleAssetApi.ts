import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getSingleAsset } from '../../api/assets';
import { SingleAssetDetailsResponse } from '../../types/assets/index';

export default function GetSingleAssetDetails(assetId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [assetDetails, setSingleDetails] = useState<SingleAssetDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getAssetDetails = useCallback(async () => {
        const data: SingleAssetDetailsResponse | false = await getSingleAsset({
            userId: id,
            userType: role,
            assetId,
        });
        if (data) {
            const assetDetailData = data as SingleAssetDetailsResponse;
            setSingleDetails(assetDetailData);
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
        getAssetDetails();
    }, [getAssetDetails]);

    return { assetDetails, isLoading, getAssetDetails };
}
