import { useState, useCallback, useEffect } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { employeeReimbursementDetails, ExportReimbursementData } from '../../../api/employeeSalaryApi/ReimbursementApi/index';
import {
    reimbursementTableType,
    reimbursementListingResponse,
} from '../../../types/salaryProfileTypes/ReimbursementTypes/index';

export const useGetEmployeeReimbursementApi = (
    eId: string | undefined,
    page: number,
    limit: number,
    year: number,
    month: number | string,
    reloadTable: boolean,
    searchText?: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [employeeReimbursementRows, setEmployeeReimbursementRows] = useState<
        reimbursementTableType[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getEmployeeReimbursementList = useCallback(async () => {
        setIsLoading(true);
        const data: reimbursementListingResponse | false = await employeeReimbursementDetails({
            userId: id,
            userType: role,
            eId,
            limit,
            page,
            year,
            month,
            searchText
        });
        if (data) {
            const arr = data?.rows?.map(item => ({
                expenseDate: new Date(item.expenseDate).toISOString().split('T')[0] ?? '',
                expenseDetails: item.expenseDetails ?? '',
                amountPaid: `${item.totalPay || 0}`,
                transferMethod: item.transferMethod ?? '',
                paymentStatus: item.paymentStatus ?? '',
                invoice: item.supportingDocs ? 'Available' : 'NA',
                action: '',
                id: item.id,
                supportingDocs: item.supportingDocs || '',
                employeeName: '',
                employeeId: item.employee,
                managerEmail: item.managerEmail,
            }));
            setCount(data.count);
            setEmployeeReimbursementRows(arr);
        }
        setIsLoading(false);
    }, [id, role, eId, limit, page, year, month,searchText]);
    useEffect(() => {
        getEmployeeReimbursementList();
    }, [getEmployeeReimbursementList, reloadTable]);

    return {
        tableDatas: employeeReimbursementRows,
        orderCount: count,
        tableLoading: isLoading,
    };
};

export const useExportEmployeeReimbursementApi = (
    eId: string ,
    year: number,
    month: number | string,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    
    const [isLoading, setIsLoading] = useState(false);
    const exportEmployeeReimbursement = useCallback(async () => {
        setIsLoading(true);
        const data= await ExportReimbursementData({
            userId: id,
            userType: role,
            eId,
            year,
            month,
            searchText
        });
        if(data){
             const arrayBuffer = new Uint8Array(data.buffer.data);
             const blob = new Blob([arrayBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });

                // Trigger download
                saveAs(blob, "reimbursement.xlsx");
        }
        
        setIsLoading(false);
    }, [id, role, eId, year, month,searchText]);

    return {
        exportEmployeeReimbursement,
        isLoading
    };
};

