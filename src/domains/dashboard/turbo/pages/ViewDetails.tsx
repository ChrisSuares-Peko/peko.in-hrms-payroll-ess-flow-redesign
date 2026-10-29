import React from 'react';

import { Skeleton } from 'antd';
import { useLocation, useSearchParams } from 'react-router-dom';

import VehicleDetails from '../components/addVehicle/VehicleDetails';
import useGetFleetApi from '../hooks/useGetFleetApi';

const ViewDetails = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const idFromQuery = searchParams.get('id');
    // Prefer router state (Manage Fleet row click); fall back to ?id= so the page is
    // reachable directly (e.g. Cancel/Back from the FASTag payment summary).
    const vehicleId = location.state?.key ?? (idFromQuery ? Number(idFromQuery) : undefined);

    const { details, loading, setRefresh } = useGetFleetApi({ id: vehicleId });

    return (
        <>
            {loading ? (
                <Skeleton />
            ) : (
                <VehicleDetails
                    verifyRcResponse={details}
                    id={vehicleId}
                    setRefresh={setRefresh}
                />
            )}
        </>
    );
};

export default ViewDetails;
