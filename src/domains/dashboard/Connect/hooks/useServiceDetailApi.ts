import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getServiceDetails } from '../api/index';
import { ConnectDetailResponse, ConnectDetails } from '../types/index';

export default function useServiceDetailApi(connectID: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [connectDetails, setConnectDetails] = useState<ConnectDetails>();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const getConnectDetails = useCallback(async () => {
        const data: ConnectDetailResponse | false = await getServiceDetails({
            userId: id,
            userType: role,
            serviceID: connectID,
        });
        if (data) {
            const connectDetailData = data as ConnectDetailResponse;
            setConnectDetails(connectDetailData.data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
            navigate(`/${paths.connect.index}`);
        }
    }, [id, role, connectID, navigate]);

    useEffect(() => {
        if (connectID) {
            getConnectDetails();
        }
    }, [connectID, getConnectDetails]);

    return { data: connectDetails, isLoading };
}
