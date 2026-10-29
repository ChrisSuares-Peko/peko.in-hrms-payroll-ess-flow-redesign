import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/api';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { setData } from '../../billPayments/slices/beneficiary';
import {
    AddBeneficiaryApi,
    deleteBeneficiaryApi,
    getBeneficiaryOtp,
    getlatestbeneficiary,
    getServiceBeneficiary,
    updateBeneficiaryApi,
} from '../api/index';
import {
    BeneficiariesResponse,
    BeneficiaryActionType,
    BeneficiaryFormValues,
    CustomerParam,
    UseGetBeneficiariesProps,
    addEditBeneficiaryPayload,
    deleteBeneficicaryPayload,
} from '../types/index';

export default function useBeneficiaryApis({
    accessKey,
    openOtpModal,
    closeOtpModal,
    closeAddModal,
    closeConfirmationModal,
    formRefName,
    beneficiaryActionType,
    setBeneficiaryActionType,
    editValues,
    selectedBillerData,
}: UseGetBeneficiariesProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [buttonLoader, setButtonLoader] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [formValues, setFormValues] = useState<BeneficiaryFormValues>();

    const { beneficiaryData, isLoading, refresh, formIntialValues } = useAppSelector(
        state => state.reducer.beneficiary
    );
    const dispatch = useAppDispatch();

    const getBeneficiariesList = useCallback(async () => {
        dispatch(setData({ beneficiaryData: [], isLoading: true }));
        const data: BeneficiariesResponse | false = !accessKey
            ? await getlatestbeneficiary({ userId: id, userType: role })
            : await getServiceBeneficiary({ userId: id, userType: role, accessKey });
        dispatch(
            setData({
                beneficiaryData: data && data?.beneficiaries?.length > 0 ? data.beneficiaries : [],
                isLoading: false,
            })
        );
    }, [id, role, accessKey, dispatch]);

    const sendOtpApi = async (ActionType: string, values?: BeneficiaryFormValues) => {
        setIsOtpSending(true);
        const data: SuccessGenericResponse<{}> | false = await getBeneficiaryOtp({
            userId: id,
            userType: role,
            ActionType,
            accessKey: values?.accessKey,
            beneficiaryId: values?.beneficiaryId,
        });
        if (data && data.status) {
            if (openOtpModal && closeConfirmationModal) {
                closeConfirmationModal();
                openOtpModal();
            }
        }
        setIsOtpSending(false);
    };

    const addBeneficiary = async (payload: addEditBeneficiaryPayload) => {
        setButtonLoader(true);
        const data: SuccessGenericResponse<{}> | false = await AddBeneficiaryApi(payload);
        if (data && data.status) {
            dispatch(setData({ refresh: !refresh, isLoading: false }));
            if (closeOtpModal && closeAddModal) {
                closeOtpModal();
                closeAddModal();
                formRefName?.current?.resetForm();
                dispatch(
                    showToast({
                        description: data.message || 'Beneficiary added successfully',
                        variant: 'success',
                    })
                );
            }
        }
        setButtonLoader(false);
    };

    const updateBeneficicary = async (payload: addEditBeneficiaryPayload) => {
        setButtonLoader(true);
        const data: SuccessGenericResponse<{}> | false = await updateBeneficiaryApi(payload);
        if (data && data.status) {
            dispatch(setData({ refresh: !refresh, isLoading: false }));
            if (closeOtpModal && closeAddModal) {
                closeOtpModal();
                closeAddModal();
                formRefName?.current?.resetForm();
                dispatch(
                    showToast({
                        description: data.message || 'Beneficiary updated successfully',
                        variant: 'success',
                    })
                );
            }
        }
        setButtonLoader(false);
    };

    const deleteBeneficicary = async (payload: deleteBeneficicaryPayload) => {
        setButtonLoader(true);
        const data: SuccessGenericResponse<{}> | false = await deleteBeneficiaryApi(payload);
        setButtonLoader(false);
        if (data && data.status) {
            dispatch(setData({ refresh: !refresh, isLoading: false }));
            if (closeAddModal && closeOtpModal) {
                closeOtpModal();
                closeAddModal();
                dispatch(
                    showToast({
                        description: data.message || 'Beneficiary deleted successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
        }
        return false;
    };

    const { ADD, EDIT, DELETE } = BeneficiaryActionType;

    // Persist only the currently-selected provider's params. When a beneficiary is edited and the
    // service provider is switched, the previous provider's fields linger in the Formik state;
    // filtering against selectedBillerData drops those stale params so the DB stores exactly what
    // the form shows.
    const buildCustomerParamsArray = (params: Record<string, unknown>) => {
        const allowedParamNames = new Set(
            (selectedBillerData ?? []).map(param => param.paramName)
        );
        return Object.entries(params)
            .filter(([paramName]) => allowedParamNames.has(paramName))
            .map(([paramName, value]): { name: string; value: any } => ({
                name: paramName,
                value,
            }));
    };

    let initialValues: any;
    const generateIntialValues = (billerData: CustomerParam[]) => {
        initialValues = {
            accessKey: formIntialValues?.accessKey || '',
            name: formIntialValues?.name || '',
            billerId: formIntialValues?.billerId || '',
            serviceProvider: formIntialValues?.serviceProvider || '',
            phoneNo: formIntialValues?.phoneNo || '',
            providerCircle: formIntialValues?.providerCircle || '',
        };
        if (billerData && billerData.length > 0) {
            billerData.forEach(param => {
                initialValues[param.paramName] = '';
            });
        }
        if (editValues && editValues.customerParams && editValues.customerParams.length > 0) {
            editValues.customerParams.forEach(param => {
                if (param.name) initialValues[param.name] = param.value || '';
            });
        }
        return initialValues;
    };

    const handleOtpSubmit = async (values: BeneficiaryFormValues) => {
        const valuesAreSame = JSON.stringify(values) === JSON.stringify(initialValues);
        if (valuesAreSame) {
            // No fields changed — skip the API call and just close the form as a successful submit.
            if (closeOtpModal && closeAddModal) {
                closeOtpModal();
                closeAddModal();
                formRefName?.current?.resetForm();
            }
            return;
        }
        const {
            name,
            phoneNo,
            serviceProvider,
            providerCircle,
            billerId,
            accessKey: accessKeyFromForm,
            ...customerParams
        } = values;

        const submitData: any = {
            accessKey: accessKeyFromForm || accessKey,
            name,
            serviceProvider,
        };
        const acc = accessKeyFromForm || accessKey;
        if (acc === accessKeys.prepaid) {
            setFormValues({ ...submitData, phoneNo, providerCircle });
        } else {
            const customerParamsArray = buildCustomerParamsArray(customerParams);
            setFormValues({ ...submitData, billerId, customerParams: customerParamsArray });
        }

        if (editValues) {
            setBeneficiaryActionType(EDIT);
            await sendOtpApi(EDIT, { ...values, beneficiaryId: editValues.id });
            return;
        }
        await sendOtpApi(ADD, values);
    };

    const handleFormSubmit = async (otp: string) => {
        if (beneficiaryActionType === ADD) {
            addBeneficiary({
                userId: id,
                userType: role,
                ...formValues,
                isActive: '1',
                credentialId: id.toString(),
                // scope: 'email',
                // otp,
            });
        } else if (beneficiaryActionType === EDIT) {
            updateBeneficicary({
                id: editValues?.id,
                userId: id,
                userType: role,
                ...formValues,
                isActive: '1',
                credentialId: id.toString(),
                // scope: 'email',
                // otp,
            });
        } else if (beneficiaryActionType === DELETE) {
            const resp = await deleteBeneficicary({
                userId: id,
                userType: role,
                id: editValues?.id,
                // scope: 'email',
                // otp,
            });
            if (resp) setBeneficiaryActionType(EDIT);
        }
    };

    const checkDuplicateBeneficiary = (
        values: BeneficiaryFormValues,
        currentAccessKey: string
    ): boolean => {
        if (!beneficiaryData || beneficiaryData.length === 0) {
            return false;
        }

        const acc = values.accessKey || currentAccessKey;

        // For prepaid beneficiaries, check phoneNo + serviceProvider + providerCircle + accessKey
        if (acc === accessKeys.prepaid) {
            const isDuplicate = beneficiaryData.some(beneficiary => (
                    beneficiary.accessKey === acc &&
                    beneficiary.phoneNo === values.phoneNo &&
                    beneficiary.serviceProvider === values.serviceProvider &&
                    beneficiary.providerCircle === values.providerCircle &&
                    // Exclude current beneficiary if editing
                    (!editValues || beneficiary.id !== editValues.id)
                ));
            return isDuplicate;
        }

        // For postpaid beneficiaries, check billerId + customerParams + accessKey.
        // Only compare the currently-selected provider's params so stale fields left over from a
        // provider switch don't skew the match.
        const customerParamsArray = buildCustomerParamsArray(values as Record<string, unknown>);

        const isDuplicate = beneficiaryData.some(beneficiary => {
            // Must match accessKey
            if (beneficiary.accessKey !== acc) return false;
            
            // Must match billerId
            if (beneficiary.billerId !== values.billerId) return false;
            
            // Exclude current beneficiary if editing
            if (editValues && beneficiary.id === editValues.id) return false;

            // Check if customerParams match
            if (!beneficiary.customerParams || beneficiary.customerParams.length === 0) {
                return customerParamsArray.length === 0;
            }

            if (beneficiary.customerParams.length !== customerParamsArray.length) {
                return false;
            }

            // Compare customerParams - all should match
            const beneficiaryParamsMap = new Map(
                beneficiary.customerParams.map(param => [
                    param.name || (param as any).paramName,
                    param.value || (param as any).paramValue,
                ])
            );
            
            const allParamsMatch = customerParamsArray.every(
                param => beneficiaryParamsMap.get(param.name) === param.value
            );

            return allParamsMatch;
        });

        return isDuplicate;
    };

    const handleDirectSubmit = async (values: BeneficiaryFormValues) => {
        const valuesAreSame = JSON.stringify(values) === JSON.stringify(initialValues);
        if (valuesAreSame) {
            // No fields changed — skip the API call and just close the form as a successful submit.
            if (closeOtpModal && closeAddModal) {
                closeOtpModal();
                closeAddModal();
                formRefName?.current?.resetForm();
            }
            return;
        }

        const acc = values.accessKey || accessKey;

        // Check for duplicate beneficiary (when adding or editing)
        const isDuplicate = checkDuplicateBeneficiary(values, accessKey!);
        if (isDuplicate) {
            dispatch(
                showToast({
                    description: 'This beneficiary is already added. Please add another beneficiary.',
                    variant: 'error',
                })
            );
            return;
        }

        const {
            name,
            phoneNo,
            serviceProvider,
            providerCircle,
            billerId,
            accessKey: accessKeyFromForm,
            ...customerParams
        } = values;

        const submitData: any = {
            accessKey: accessKeyFromForm || accessKey,
            name,
            serviceProvider,
        };
        
        let preparedFormValues: any;
        if (acc === accessKeys.prepaid) {
            preparedFormValues = { ...submitData, phoneNo, providerCircle };
        } else {
            const customerParamsArray = buildCustomerParamsArray(customerParams);
            preparedFormValues = { ...submitData, billerId, customerParams: customerParamsArray };
        }

        // Set formValues for consistency (even though we're not using it in this flow)
        setFormValues(preparedFormValues);

        // Determine action type and call API directly with prepared payload
        if (editValues) {
            setBeneficiaryActionType(EDIT);
            await updateBeneficicary({
                id: editValues.id,
                userId: id,
                userType: role,
                ...preparedFormValues,
                isActive: '1',
                credentialId: id.toString(),
            });
        } else {
            setBeneficiaryActionType(ADD);
            await addBeneficiary({
                userId: id,
                userType: role,
                ...preparedFormValues,
                isActive: '1',
                credentialId: id.toString(),
            });
        }
    };

    useEffect(() => {
        getBeneficiariesList();
    }, [getBeneficiariesList, refresh]);

    return {
        beneficiaryData,
        isLoading,
        refresh,
        buttonLoader,
        sendOtpApi,
        addBeneficiary,
        updateBeneficicary,
        deleteBeneficicary,
        isOtpSending,
        handleOtpSubmit,
        handleFormSubmit,
        handleDirectSubmit,
        generateIntialValues,
    };
}
