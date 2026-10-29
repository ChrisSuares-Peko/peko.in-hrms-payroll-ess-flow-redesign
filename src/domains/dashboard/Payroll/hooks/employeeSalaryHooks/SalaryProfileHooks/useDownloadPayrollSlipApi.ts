import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { downloadPayslip } from '../../../api/employeeSalaryApi/SalaryProfileApi/index';
import { downloadSlipResponse } from '../../../types/salaryProfileTypes/ProfileTypes/index';

export default function DownloadPayslipData() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getPayslipDetails = useCallback(
        async (salaryId: string) => {
            setIsLoading(true);
            const data: downloadSlipResponse | false = await downloadPayslip({
                userId: id,
                userType: role,
                salaryId,
            });
            if (data) {
                const payslip = data as downloadSlipResponse;
                const uint8Array = new Uint8Array(payslip.pdfData.data);

                const blob = new Blob([uint8Array], { type: 'application/pdf' });

                saveAs(blob, 'Payslip.pdf');
            }
            setIsLoading(false);
        },
        [id, role]
    );

    return { loader: isLoading, getPayslipDetails };
}
