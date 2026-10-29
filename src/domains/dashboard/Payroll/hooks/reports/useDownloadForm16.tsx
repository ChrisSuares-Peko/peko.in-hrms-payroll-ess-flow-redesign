import { useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppSelector } from '@src/hooks/store';

import { getForm16Download } from '../../api/reports/tds';

export default function DownloadForm16() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const getForm16 = async (
        employeeId: string,
        year: string,
        formType: 'form16b' | 'form16a'
    ) => {
        setIsLoading(true);
        const data: any | false = await getForm16Download({
            userId: id,
            userType: role,
            eid:employeeId,
            year,
            formtype:formType,
        });

        if (data) {
            const payslip = data as any;
            const uint8Array = new Uint8Array(payslip.pdfData.data);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            if(formType==="form16a"){
                saveAs(blob, 'form16a.pdf');
            }else{
                saveAs(blob, 'form16b.pdf');
                
            }
        }
        setIsLoading(false);
    };

    return { isLoading, getForm16 };
}
