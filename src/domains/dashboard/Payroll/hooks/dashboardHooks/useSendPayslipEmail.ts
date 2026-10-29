import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmployeePayslip } from '../../api/dashBoardIndex';

export default function useSendPayslipEmail() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isSending, setIsSending] = useState(false);

    const sendPayslipEmail = async (employeeId: string, year: string, month: string) => {
        setIsSending(true);
        const resp = await getEmployeePayslip({
            userId: id,
            userType: role,
            employeeId,
            year,
            month,
            sendEmail: true,
        });
        setIsSending(false);
        return !!resp;
    };

    return { isSending, sendPayslipEmail };
}
