import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { getpartner } from '@src/domains/admin/users/api';
import { categoryResponse } from '@src/domains/admin/users/types/corporateUserTypes';
import { useAppSelector } from '@src/hooks/store';

import {
    createDisabledApi,
    getCorporates,
    getOperators,
    getSubPartner,
} from '../../api/disabledService';
import {
    CorporateUser,
    CorporateUserData,
    Service,
    ServiceProvider,
    ServiceProviderData,
    createDisabledService,
} from '../../types/disabledTypes';

type Props = {
    searchCorporate: string;
    searchOperator: string;
    partnerId?: string;
    subPartnerId?: string;
};

const useAddDisabledService = ({
    searchCorporate,
    searchOperator,
    partnerId,
    subPartnerId,
}: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubPartnerLoading, setIsSubPartnerLoading] = useState(false);
    const [partnerData, setPartnerData] = useState<{ oValue: string; oName: string }[]>();
    const [subPartnerData, setSubPartnerData] = useState<{ oValue: string; oName: string }[]>();
    const [corporateData, setCorporateData] = useState<DropDown>();
    const [operatorData, setOperatorData] = useState<DropDown>();
    const getAllCorporates = useCallback(async () => {
        setIsLoading(true);
        const data: CorporateUserData | false = await getCorporates({
            userId: id,
            userType: role,
            searchCorporate,
            partnerId,
            subPartnerId,
        });
        if (data) {
            const arr = data.result.map((item: CorporateUser) => ({
                value: item.credentialId.toString(),
                label: item.name,
            }));
            setCorporateData(arr);
        }
    }, [id, partnerId, role, searchCorporate, subPartnerId]);
    const getAllOperators = useCallback(async () => {
        setIsLoading(true);
        const data: ServiceProviderData | false = await getOperators({
            userId: id,
            userType: role,
            searchOperator,
            partnerId,
            subPartnerId,
        });
        if (data) {
            const arr = data.data.map((item: ServiceProvider) => ({
                value: item.id.toString(),
                label: item.serviceProvider,
            }));
            setOperatorData(arr);
        }
    }, [id, partnerId, role, searchOperator, subPartnerId]);
    const getPartners = useCallback(async () => {
        setIsLoading(true);
        const data: categoryResponse | false = await getpartner({
            userId: id,
            userType: role,
            searchText: '',
        });
        if (data) {
            const partners = data.data.map(item => ({
                oValue: `${item.id}`,
                oName: item.name,
            }));
            setPartnerData([{ oValue: 'default', oName: 'Default' }, ...partners]);
        }
        setIsLoading(false);
    }, [id, role]);

    const getSubPartners = useCallback(async () => {
        setIsSubPartnerLoading(true);
        if (partnerId && partnerId !== 'default') {
            const data: categoryResponse | false = await getSubPartner({
                userId: id,
                userType: role,
                partnerId,
            });
            if (data) {
                const partners = data.data.map(item => ({
                    oValue: `${item.id}`,
                    oName: item.name,
                }));
                if (partners.length) {
                    partners.unshift({ oName: 'Default', oValue: 'default' });
                }
                setSubPartnerData(partners);
            }
        } else {
            setSubPartnerData(undefined);
        }
        setIsSubPartnerLoading(false);
    }, [id, partnerId, role]);
    const createDisabledServices = useCallback(
        async (payload: createDisabledService) => {
            setIsLoading(true);
            const data: Service | false = await createDisabledApi({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllCorporates();
        getAllOperators();
        getPartners();
        getSubPartners();
    }, [getAllCorporates, getAllOperators, getPartners, getSubPartners]);
    return {
        operatorData,
        corporateData,
        createDisabledServices,
        partnerData,
        subPartnerData,
        isLoading,
        isSubPartnerLoading,
    };
};

export default useAddDisabledService;
