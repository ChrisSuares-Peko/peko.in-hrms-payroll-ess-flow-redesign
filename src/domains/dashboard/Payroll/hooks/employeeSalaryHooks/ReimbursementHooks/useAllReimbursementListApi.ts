import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { employeeReimbursementList } from '../../../api/employeeSalaryApi/ReimbursementApi/index';
import {
    reimbursementTableType,
    reimbursementAllListingResponse,
} from '../../../types/salaryProfileTypes/ReimbursementTypes/index';

export const useGetAllReimbursementApi = (
    page: number,
    limit: number,
    search: string,
    year: number,
    month: string | number,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeReimbursementRows, setEmployeeReimbursementRows] = useState<
        reimbursementTableType[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getEmployeeReimbursementList = useCallback(async () => {
        setIsLoading(true);
        const data: reimbursementAllListingResponse | false = await employeeReimbursementList({
            userId: id,
            userType: role,
            limit,
            page,
            search,
            year,
            month,
        });
        if (data) {
            const arr = data?.rows?.map(item => ({
                expenseDate: new Date(item?.expenseDate).toISOString().split('T')[0] ?? '',
                expenseDetails: item?.expenseDetails ?? '',
                amountPaid: `${item?.totalPay}`,
                transferMethod: item?.transferMethod ?? '',
                paymentStatus: item?.paymentStatus ?? '',
                invoice: item?.supportingDocs ? 'Available' : 'NA',
                action: '',
                id: item?.id,
                supportingDocs: item?.supportingDocs || '',
                employeeName: item?.employee?.personalInformation.fullName ?? '',
                employeeId: item?.employee?.id ?? '',
                employeeCode: item?.employee?.employeeInformation.employeeId ?? '',
                managerEmail: item?.managerEmail ?? '',
            }));
            setCount(data.count);
            setEmployeeReimbursementRows(arr);
        }
        setIsLoading(false);
    }, [id, role, limit, page, search,month,year]);
    useEffect(() => {
        getEmployeeReimbursementList();
    }, [getEmployeeReimbursementList, reloadTable]);

    return {
        tableDatas: employeeReimbursementRows,
        orderCount: count,
        tableLoading: isLoading,
    };
};
