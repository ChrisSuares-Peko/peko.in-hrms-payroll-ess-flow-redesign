import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getQRcodeApi } from '../api/index';

export default function useGetQRcode(
    iccid: string,
    corporateTxnId?: string,
    customerUid?: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [QRCodeURL, setQRCodeURL] = useState<any>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isTopUp, setIsTopUp] = useState<boolean>(false);

    const getQRcode = useCallback(async () => {
        const esimIdentifier = corporateTxnId || iccid;

        if (!esimIdentifier) return;

        setIsLoading(true);

        const response = await getQRcodeApi({
            userId: id,
            userType: role,
            corporateTxnId: esimIdentifier,
            customerUid
        });

        if (response) {
            // Check if it's a top-up (QR not available) — top-up returns status: true but data: {}
            if (response.status === true && (!response.data || typeof response.data === 'object' && Object.keys(response.data).length === 0)) {
                setIsTopUp(true);
                setQRCodeURL(null);
            } else if (response.status === true && response.data && typeof response.data === 'string') {
                // New purchase - generate QR code (data is base64 string)
                const { data } = response;
                // Convert Base64 Image:
                const byteCharacters = atob(data);
                const byteNumbers = new Array(byteCharacters.length);
                // eslint-disable-next-line no-plusplus
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray]);
                const QRurl = URL.createObjectURL(blob);

                setQRCodeURL(QRurl);
                setIsTopUp(false);
            }
        }

        setIsLoading(false);
    }, [iccid, corporateTxnId, customerUid, id, role]);

    useEffect(() => {
        getQRcode();
    }, [getQRcode]);

    return { QRCodeURL, isLoading, isTopUp };
}
