import React from 'react';

import { Skeleton } from 'antd';
import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import VehicleDetails from '../components/addVehicle/VehicleDetails';
import HeaderBanner from '../components/homepage/HeaderBanner';

const AddVehicle = () => {
    const location = useLocation();

    const { inputParams, verifyRcResponse } = useAppSelector(state => state.reducer.turbo);

    let loading = false;
    //    useEffect(() => {
    //         // Update stateKey if the location.state changes
    if (location.state?.key) {
        loading = true;
    }
    // }, [location.state]);


    if (verifyRcResponse && Object.keys(verifyRcResponse).length !== 0) {
        loading = false;
    }

    return (
        <>
            <HeaderBanner verifyRcResponse={verifyRcResponse} inputParams={inputParams} />
            {loading ? (
                <Skeleton />
            ) : (
                <>
                    {verifyRcResponse &&
                        verifyRcResponse.vehicleNumber !== null &&
                        Object.keys(verifyRcResponse).length !== 0 && (
                            <VehicleDetails
                                verifyRcResponse={verifyRcResponse}
                                inputParams={inputParams}
                            />
                        )}
                </>
            )}
        </>
    );
};

export default AddVehicle;
