import { useCallback, useEffect, useState } from 'react';

import { ApiClient } from '@src/services/config';

type PhoneCode = {
    label: string;
    value: string;
};

export default function usePhoneCodesApi() {
    const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);

    const fetchPhoneCodes = useCallback(async () => {
        const resp: any = await ApiClient.get('user/general/phone-codes').catch(() => null);
        if (resp?.data?.phoneCodes) setPhoneCodes(resp.data.phoneCodes);
    }, []);

    useEffect(() => {
        fetchPhoneCodes();
    }, [fetchPhoneCodes]);

    return { phoneCodes };
}
