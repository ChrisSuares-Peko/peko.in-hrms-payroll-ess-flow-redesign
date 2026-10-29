import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBanks } from '../../api/organizationSettings/index';
import { BankListResponse } from '../../types/organizationSettings/index';

export function useGetBankDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [bankDetails, setBankDetails] = useState<any[]>([]);

    const getBankList = useCallback(async () => {
        const data: BankListResponse | false = await getBanks({
            userId: id,
            userType: role,
        });
        if (data) {
            const details = data.bankDetails as any[];
            setBankDetails(details);
        }
    }, [id, role]);

    useEffect(() => {
        getBankList();
    }, [getBankList]);

    const generateBankDetailsDropdown = (data: any[]) =>
        data.map(bank => ({
            value: bank.id ?? '',
            label: bank.bankName ?? '',
            accountHolderName: bank.accountHolderName ?? '',
            bankName: bank.bankName ?? '',
            accountNumber: bank.accountNumber ?? '',
            ifscCode: bank.ifscCode ?? '',
            bankBranch: bank.bankBranch ?? '',
        }));

    return { data: bankDetails, generateBankDetailsDropdown };
}
