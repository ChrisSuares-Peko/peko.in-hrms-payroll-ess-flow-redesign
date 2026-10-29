import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { CreateForm16A, getEmployeesPartA } from '../../api/reports/form16A';

export default function useForm16AApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [employeesPartA, setEmployeesPartA] = useState<any[]>([]);
    const CreateForm16AApi = useCallback(
        async (payloadData: any) => {
            setIsLoading(true);
            try {
                const response = await CreateForm16A({
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
    const getForm16A = useCallback(
        async (employee: number, year: string) => {
            const data: any | false = await getEmployeesPartA({
                userId: id,
                userType: role,
                employee,
                assessmentYear: year,
            });
            
            if (data) {
                const details = data || [];
                setEmployeesPartA(details);
            }else{
                setEmployeesPartA([])
            }
        },
        [id, role]
    );

    // useEffect(() => {
    //     employeeList();
    // }, [employeeList]);

    return { CreateForm16AApi, getForm16A, employeesPartA, isLoading };
}
