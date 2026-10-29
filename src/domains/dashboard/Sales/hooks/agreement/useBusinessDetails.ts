import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProfileAddressesApi, getProfileCompanyApi } from '../../api/settings';
import { InvoiceAddressItem, InvoiceProfileData } from '../../types/settings';

export const useBusinessDetails = (skip: boolean = false) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [profile, setProfile] = useState<InvoiceProfileData | null>(null);
    const [address, setAddress] = useState<InvoiceAddressItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!id || !role || skip) return;

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const [profileResp, addressResp] = await Promise.all([
                    getProfileCompanyApi({ userId: id, userType: role }),
                    getProfileAddressesApi({ userId: id, userType: role }),
                ]);

                if (profileResp) setProfile(profileResp);

                if (addressResp?.length > 0) {
                    setAddress(addressResp.find(addr => addr.default === 1) ?? addressResp[0]);
                }
            } catch (error) {
                console.error('Error fetching business details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id, role, skip]);

    return { profile, address, isLoading };
};
