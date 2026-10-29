import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeeDocs } from '../../api/employeeApi';
import { EmployeeDocument } from '../../types/type';

export default function useGetEmployeeDocument(empID: string, currentPage: number,search:string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeDocs, setEmployeeDocs] = useState<EmployeeDocument[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [docCount, setDocCount] = useState<number>(0);

    const getEmployeeDocuments = useCallback(async () => {
        setIsLoading(true)
        const data = await getEmployeeDocs({
            userId: id,
            userType: role,
            employeeId: empID,
            page: currentPage,
            limit: 10,
            search
        });

        if (data) {
            setEmployeeDocs(data.data.documents);
            setDocCount(data.data.total);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, empID, currentPage,search]);

  
    useEffect(() => {
        getEmployeeDocuments();
    }, [getEmployeeDocuments, refresh]);

    return {
        getEmployeeDocuments,
        isLoading,
        employeeDocs,
        setRefresh,
        docCount,
    };
}
