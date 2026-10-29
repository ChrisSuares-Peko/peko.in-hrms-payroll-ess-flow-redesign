import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBankDetails } from '../../api/employeeProfileApi';

export function useGetEmployeeBankDetailsApi(eId: string | undefined, reloadTable: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [bankData, setBankData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const allBankDetails = useCallback(async () => {
        if (!eId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // Fetch the bank details
            const response = await getBankDetails({
                userId: id,
                userType: role,
                eId,
            });

            // Depending on the structure, adjust this line accordingly
            const bankDetailsArray = response.data ?? response; // Adjust based on your actual API response structure

            if (bankDetailsArray && Array.isArray(bankDetailsArray)) {
                const formattedBankDetails = bankDetailsArray.map((item: any) => ({
                    accountName: item.accountName ?? '',
                    accountNumber: item.accountNumber ?? '',
                    bankName: item.bankName ?? '',
                    ifscCode: item.ifscCode ?? '',
                    isDefaultAccount: item.isDefaultAccount ?? false,
                    id: item._id ?? '',
                }));

                setBankData(formattedBankDetails);
            }
        } catch (error) {
            console.error('Error fetching bank details:', error);
        }

        setIsLoading(false);
    }, [id, role, eId]);

    useEffect(() => {
        allBankDetails();
    }, [allBankDetails, reloadTable]);

    return { data: bankData, tableLoading: isLoading };
}
