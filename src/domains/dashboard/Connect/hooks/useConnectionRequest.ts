import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { postConnectRequest } from '../api/index';
import { ConnectRequestPayload, ConnectRequestResponse } from '../types/index';

export default function useConnectionRequest() {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { connect } = paths;

    const handleConnectionRequest = useCallback(
        async (payload: ConnectRequestPayload) => {
            try {
                const response: ConnectRequestResponse | false = await postConnectRequest({
                    ...payload,
                    credentialId: id,
                    userType: role,
                });
                if (response) {
                    const successPath = `/${connect.index}/${connect.success}`;
                    navigate(successPath, { state: { data: response } });
                } else {
                    navigate(`/${connect.index}/${connect.failed}`);
                }
            } catch (error) {
                console.error('Connection request failed:', error);
                navigate(`/${connect.index}/${connect.failed}`);
            }
        },
        [id, role, connect, navigate]
    );
    return { handleConnectionRequest };
}
