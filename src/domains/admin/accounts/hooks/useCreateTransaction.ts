import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createTransactiond, getCorporates, getOperators } from '../api/createTransaction';
import {
    CorporateRechargeData,
    ServiceData,
    ServiceResp,
    corporateDatas,
    corporateDataResp,
} from '../types/createTransactions';

type Props = {
    searchCorporate: string;
    searchOperator: string;
};

const useCreateTransaction = ({ searchCorporate, searchOperator }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [corporateData, setCorporateData] = useState<DropDown>();
    const [operatorData, setOperatorData] = useState<DropDown>();
    const [category, setCategory] = useState<ServiceData[]>([]);
    const getAllCorporates = useCallback(async () => {
        const data: corporateDataResp | false = await getCorporates({
            userId: id,
            userType: role,
            searchText: searchCorporate,
        });
        if (data) {
            const arr = data.result.map((item: corporateDatas) => ({
                value: item.credentialId.toString(),
                label: `${item.name} - ${item.username}`,
            }));
            setCorporateData(arr);
        }
    }, [id, role, searchCorporate]);
    const getAllOperators = useCallback(async () => {
        const data: ServiceResp | false = await getOperators({
            userId: id,
            userType: role,
            searchText: searchOperator,
        });
        if (data) {
            const arr = data.data.map((item: ServiceData) => ({
                value: item.id.toString(),
                label: item.serviceProvider,
            }));
            setOperatorData(arr);
            setCategory(data.data);
        }
    }, [id, role, searchOperator]);
    const create = useCallback(
        async (payload: CorporateRechargeData) => {
            setIsLoading(true);
            const data: CorporateRechargeData | false = await createTransactiond({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setIsLoading(false);
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
    }, [getAllCorporates, getAllOperators]);

    return { operatorData, corporateData, create, isLoading, category };
};

export default useCreateTransaction;
