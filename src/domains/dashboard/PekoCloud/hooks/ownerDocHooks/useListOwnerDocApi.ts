import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { ownersList } from '../../api/ownerDoc';
import { OwnerDocListingResponse } from '../../types/ownerDoc';

export const useGetAllOwnerDocApi = (reloadTable: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [ownerDocData, setOwnerDocData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getOwnerDocData = useCallback(async () => {
        setIsLoading(true);
        const data: OwnerDocListingResponse | false = await ownersList({
            userId: id,
            userType: role,
            sort: 'ASC',
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                ownerName: item?.ownerName ?? '',
                percentageOfShare: item?.percentageOfShare ?? '',
                profilePicture: item?.profilePicture ?? '',
                homeAddress: item?.homeAddress ?? '',
                nationality: item?.nationality ?? '',
                passport: {
                    issueDate: item?.passport?.issueDate ?? '',
                    expireDate: item?.passport?.expireDate ?? '',
                    documentNumber: item?.passport?.documentNumber ?? '',
                    document: item?.passport?.document ?? '',
                },
                visa: {
                    issueDate: item?.visa?.issueDate ?? '',
                    expireDate: item?.visa?.expireDate ?? '',
                    documentNumber: item?.visa?.documentNumber ?? '',
                    document: item?.visa?.document ?? '',
                },
                insurance: {
                    issueDate: item?.insurance?.issueDate ?? '',
                    expireDate: item?.insurance?.expireDate ?? '',
                    documentNumber: item?.insurance?.documentNumber ?? '',
                    document: item?.insurance?.document ?? '',
                },
                emiratesId: {
                    issueDate: item?.emiratesId?.issueDate ?? '',
                    expireDate: item?.emiratesId?.expireDate ?? '',
                    documentNumber: item?.emiratesId?.documentNumber ?? '',
                    document: item?.emiratesId?.document ?? '',
                },
                ejari: {
                    issueDate: item?.ejari?.issueDate ?? '',
                    expireDate: item?.ejari?.expireDate ?? '',
                    documentNumber: item?.ejari?.documentNumber ?? '',
                    document: item?.ejari?.document ?? '',
                },
                bankDetails: {
                    name: item?.bankDetails?.name ?? '',
                    iban: item?.bankDetails?.iban ?? '',
                    swiftcode: item?.bankDetails?.swiftcode ?? '',
                    document: item?.bankDetails?.document ?? '',
                },
                id: item?.id ?? '',
            }));
            setCount(data.totalData);
            setOwnerDocData(arr);
        }
        setIsLoading(false);
    }, [id, role]);
    useEffect(() => {
        getOwnerDocData();
    }, [getOwnerDocData, reloadTable]);

    return {
        tableDatas: ownerDocData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
