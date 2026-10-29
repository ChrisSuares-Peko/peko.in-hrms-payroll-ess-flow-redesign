import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getIncomeDeclarationForm, incomeDeclarationForm } from '../../api/reports';
import { IncomeDeclarationFormPostResponse } from '../../types/reports';

const useIncomeDeclarationApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [incomeDeclarationData, setIncomeDeclarationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [buttonLoader, setButtonLoader] = useState(false);
    const dispatch = useAppDispatch();

    const removeEmptyStrings = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(removeEmptyStrings).filter(item => item && Object.keys(item).length > 0);
        }
        if (typeof obj === 'object' && obj !== null) {
            const cleanedObj: any = {};
            Object.entries(obj).forEach(([key, value]) => {
                const cleanedValue = removeEmptyStrings(value);
                if (
                    cleanedValue !== '' &&
                    cleanedValue !== null &&
                    (typeof cleanedValue !== 'object' || Object.keys(cleanedValue).length > 0)
                ) {
                    cleanedObj[key] = cleanedValue;
                }
            });
            return cleanedObj;
        }
        return obj;
    };

    const getIncomeDeclaration = useCallback(
        async (payload?: any) => {
            setIsLoading(true);

            const data: any | false = await getIncomeDeclarationForm({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data.data) {
                setIncomeDeclarationData(data.data);
            } else {
                dispatch(
                    showToast({
                        description:
                            data.message ||
                            'No income declaration found for the selected user. Please add income details.',
                        variant: 'info',
                    })
                );
            }

            setIsLoading(false);
        },
        [dispatch, id, role]
    );

    const updateIncomeDeclarationForm = async (values: any) => {
        setButtonLoader(true);

        const {
            employee,
            financialYear,
            hraDetails,
            ltaDetails,
            homeLoanInterestDetails,
            incomeDeclaration,
            chapterVIA,
            homeLoanDeductions,
        } = values;

        const filteredValues = removeEmptyStrings({
            employee,
            financialYear,
            hraDetails,
            ltaDetails,
            homeLoanInterestDetails,
            incomeDeclaration,
            chapterVIA,
            homeLoanDeductions,
        });

        const data: IncomeDeclarationFormPostResponse | false = await incomeDeclarationForm({
            userId: id,
            userType: role,
            ...filteredValues,
        });

        if (data) {
            dispatch(
                showToast({
                    description: 'Income declaration form updated successfully',
                    variant: 'success',
                })
            );
        }

        setButtonLoader(false);
        return data;
    };

    return {
        isLoading,
        buttonLoader,
        incomeDeclarationData,
        getIncomeDeclaration,
        updateIncomeDeclarationForm,
    };
};

export default useIncomeDeclarationApi;
