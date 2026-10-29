import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { saveMerchantApi } from '../api/address';
import { SavedMerchantResponse } from '../types/address';
import { Address } from '../types/index';

export const useSaveAddressApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);

    const handleCreateMerchantProfile = async (originAddress: Address) => {
        const response: SavedMerchantResponse | false = await saveMerchantApi({
            userId: id,
            userType: role,
            profileName: originAddress.Line1,
            merchantEmail: originAddress.Description,
            merchantMobileNo: originAddress.Line3,
            merchantAddress: originAddress.Line2,
            merchantCity: originAddress.City,
            merchantPinCode: originAddress.PostCode,
            merchantRemarks: originAddress.Remark,
            saveSenderAddress: originAddress.saveSenderAddress!,
        });
        if (response) {
            const { data } = response;
            setIsLoading(false);
            return data.nickname;
        }
        setIsLoading(false);
        return false;
    };

    return { data: '', isLoading, handleCreateMerchantProfile };
};
