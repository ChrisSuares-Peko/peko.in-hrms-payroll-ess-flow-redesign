import { useCallback, useEffect, useState } from 'react';

import { commonSelectType } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { serviceTypeListing, vendorListing } from '../api/serviceOperator';
import { IServiceTypeListingResponse, IVendorListingResponse } from '../types/serviceOperator';

export const useOperatorDropdowns = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [vendorDetails, setVendorDetails] = useState<commonSelectType[]>([]);
    const [serviceTypeDetails, setServiceTypeDetails] = useState<commonSelectType[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const getVendorList = useCallback(async () => {
        const data: IVendorListingResponse | false = await vendorListing({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const listingData = data;

            const arr = listingData?.data?.map(item => ({
                oName: item.vendorName ?? '',
                oValue: item.id ?? '',
            }));
            setVendorDetails(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [searchText, id, role]);

    const getServiceTypeList = useCallback(async () => {
        const data: IServiceTypeListingResponse | false = await serviceTypeListing();
        if (data) {
            const listingData = data;

            const arr = listingData?.serviceType?.map(item => ({
                oName: item.label ?? '',
                oValue: item.value ?? '',
            }));
            setServiceTypeDetails(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getVendorList();
        getServiceTypeList();
    }, [getVendorList, getServiceTypeList]);
    return {
        vendors: vendorDetails,
        serviceCategories: serviceTypeDetails,
        isLoading,
    };
};
