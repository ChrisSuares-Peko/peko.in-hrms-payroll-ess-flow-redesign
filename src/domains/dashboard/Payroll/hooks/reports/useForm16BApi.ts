import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { CreateForm16B, getEmployeesPartB } from '../../api/reports/form16B';

export default function useForm16BApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [employeesPartB, setEmployeesPartB] = useState<any[]>([]);
    const CreateForm16BApi = useCallback(
        async (payloadData: any) => {
            setIsLoading(true);
            try {
                const response = await CreateForm16B({
                    userId: id,
                    userType: role,
                    payloadData,
                });
                if (response) {
                    console.log('File uploaded successfully:', response);
                } else {
                    console.error('File upload failed');
                }
            } catch (error) {
                console.error('Error uploading file:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [id, role]
    );
    const getForm16B = useCallback(
        async (employee: number, year: string) => {
            const data: any | false = await getEmployeesPartB({
                userId: id,
                userType: role,
                employee,
                assessmentYear: year,
            });

            if (data) {
                const details = data || [];
                setEmployeesPartB(details);
            }else{
                setEmployeesPartB([])
            }
        },
        [id, role]
    );
    return { CreateForm16BApi, getForm16B, employeesPartB, isLoading };
}
