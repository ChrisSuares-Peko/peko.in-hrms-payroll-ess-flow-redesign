import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeAssets, getEmployeeDocs } from '../../api/employeeApi';
import { assetTable } from '../../types/docAndAssetsTypes';
import { EmployeeDocument } from '../../types/type';

export default function GetEmployeeDocuments(empID: string, currentPage: number,searchText:string,assetType:string,assetStatus:string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeDocs, setEmployeeDocs] = useState<EmployeeDocument[]>();
    const [assetData, setAssetData] = useState<assetTable[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [docCount, setDocCount] = useState<number>(0);
    const [assetCount, setAssetCount] = useState<number>(0);

    const getEmployeeDocuments = useCallback(async () => {
        setIsLoading(true)
        const data = await getEmployeeDocs({
            userId: id,
            userType: role,
            employeeId: empID,
            page: currentPage,
            limit: 10,
        });

        if (data) {
            setEmployeeDocs(data.data.documents);
            setDocCount(data.data.total);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, empID, currentPage]);

    const findEmployeeAssets = useCallback(async () => {
        const data = await getEmployeeAssets({
            userId: id,
            userType: role,
            employeeId: empID,
            page: currentPage,
            limit: 10,
            assetType,
            assetStatus,
            searchText
        });

        if (data) {
            setAssetData(data.data.assets);
            setAssetCount(data.data.total);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, empID, currentPage, assetType, assetStatus, searchText]);

    useEffect(() => {
        getEmployeeDocuments();
        findEmployeeAssets();
    }, [findEmployeeAssets, getEmployeeDocuments, refresh]);

    return {
        getEmployeeDocuments,
        isLoading,
        employeeDocs,
        setRefresh,
        docCount,
        assetCount,
        findEmployeeAssets,
        assetData,
    };
}
