import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { sendForESignApi } from '../api';
import type { SendForESignPayload } from '../types';

const useSendForESign = () => {
    const dispatch = useAppDispatch();
    const { id: userId, role } = useAppSelector(s => s.reducer.auth);
    const [isSending, setIsSending] = useState(false);

    const sendForESign = async (payload: SendForESignPayload) => {
        setIsSending(true);
        const resp = await sendForESignApi({ userId, userType: role, ...payload });
        setIsSending(false);
        if (resp && resp.status) {
            return true;
        }
        dispatch(showToast({ description: (resp && (resp as any).message) || 'Failed to send for e-signature', variant: 'error' }));
        return false;
    };

    return { sendForESign, isSending };
};

export default useSendForESign;