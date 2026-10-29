import { useCallback, useEffect, useState } from 'react';

import type { SelectProps } from 'antd';

import { DropDown } from '@customtypes/general';

import { getCountriesPhoneCodeAPI } from '../../api';

export const useGetPhoneCodes = () => {
    const [phoneCodes, setPhoneCodes] = useState<SelectProps['options']>([]);
    const [isLoading, setIsLoading] = useState(true);

    const HandleGetCountriesPhoneCode = useCallback(async () => {
        const data: { phoneCodes: DropDown } | false = await getCountriesPhoneCodeAPI();

        if (data) {
            setPhoneCodes(
                data.phoneCodes.map((code, index) => ({
                    label: code.label,
                    value: code.value,
                    key: index,
                    title: '',
                }))
            );
            setIsLoading(false);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        HandleGetCountriesPhoneCode();
    }, [HandleGetCountriesPhoneCode]);

    return { phoneCodes, isLoading };
};
