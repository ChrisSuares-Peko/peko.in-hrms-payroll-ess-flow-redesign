import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createEmailDomain, getAllVendors, updateEmailDomain } from '../../api/emailDomain';
import { DropDown, EmailDomain, VendorApiResponse } from '../../types/emailDomain';

const UseCreateEmailDomain = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [allVendors, setAllvendors] = useState<DropDown>([]);

    const createNewEmailDomain = useCallback(
        async (payload: EmailDomain) => {
            setIsLoading(true);
            const data: any | false = await createEmailDomain({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    const updateEmailDomainDetails = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateEmailDomain({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return data;
            }
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    const getVendorData = useCallback(async () => {
        setIsLoading(true);
        const data: VendorApiResponse | false = await getAllVendors({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.result.map(vendor => ({
                value: vendor.id,
                label: vendor.vendorName,
            }));
            setAllvendors(arr);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getVendorData();
    }, [getVendorData]);
    return { isLoading, createNewEmailDomain, allVendors, updateEmailDomainDetails };
};

export default UseCreateEmailDomain;
