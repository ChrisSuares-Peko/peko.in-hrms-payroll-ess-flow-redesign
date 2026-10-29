import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { createEmployee } from '../../api/employeeApi';
import { CreatePayload } from '../../types/types';
import { invalidateDashboardCache } from '../dashboardHooks/useDashboardApi';
import { invalidateEmployeeCountCache } from '../dashboardHooks/useGetEmployeeCount';

export function useCreateEmployeeApi(setLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // const [isLoading, setIsLoading] = useState(false);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const createUser = async (payload: CreatePayload) => {
        setLoading(true);
        const response = await createEmployee({ ...payload, userId: id, userType: role });

        if (response.success && response.data) {
            invalidateDashboardCache();
            invalidateEmployeeCountCache();
            navigate(`/${paths.payroll.index}/${paths.payroll.employees}`);
            dispatch(
                showToast({
                    variant: 'success',
                    description: response.data.message || 'Employee created successfully',
                })
            );
        } else {
            // Use the error message from the catch block of createEmployee
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        response.errorMessage ||
                        'Failed to create the employee due to an unexpected issue.',
                })
            );
        }

        setLoading(false);
    };

    return { createUser };
}
