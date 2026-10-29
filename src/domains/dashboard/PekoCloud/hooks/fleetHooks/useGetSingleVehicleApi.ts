import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getSingleVehicle } from '../../api/fleet';
import { SingleVehicleDetailsResponse } from '../../types/fleetManagement/index';

export default function GetSingleVehicleDetails(fleetId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [vehicleDetails, setSingleVehicleDetails] = useState<SingleVehicleDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getVehicleDetails = useCallback(async () => {
        const data: SingleVehicleDetailsResponse | false = await getSingleVehicle({
            userId: id,
            userType: role,
            fleetId,
        });
        if (data) {
            const vehicleDetailData = data as SingleVehicleDetailsResponse;
            setSingleVehicleDetails(vehicleDetailData);
            setIsLoading(false);
        } else {
            navigate(`/${paths.pekoCloud.index}`);
            dispatch(
                showToast({
                    description: 'Vehicle not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
    }, [dispatch, fleetId, id, navigate, role]);

    useEffect(() => {
        getVehicleDetails();
    }, [getVehicleDetails]);

    return { vehicleDetails, getVehicleDetails, isLoading };
}
