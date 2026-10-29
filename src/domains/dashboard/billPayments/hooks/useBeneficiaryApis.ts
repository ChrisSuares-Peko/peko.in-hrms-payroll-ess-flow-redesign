import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/api';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    AddBeneficiaryApi,
    deleteBeneficiaryApi,
    getBeneficiaryOtp,
    getlatestbeneficiary,
    getServiceBeneficiary,
    updateBeneficiaryApi,
    updateBeneficiaryStatusApi,
} from '../api/index';
import { setData } from '../slices/beneficiary';
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
                beneficiaryData: data && data.beneficiaries.length > 0 ? data.beneficiaries : [],
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
            serviceProvider,
            billerId,
            accessKey: accessKeyFromForm,
            ...customerParams
        } = values;

        const customerParamsArray = buildCustomerParamsArray(customerParams);

        setFormValues({
            accessKey: accessKeyFromForm || accessKey,
            name,
            serviceProvider,
            billerId,
            customerParams: customerParamsArray,
        });

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

        const {
            name,
            serviceProvider,
            billerId,
            accessKey: accessKeyFromForm,
            ...customerParams
        } = values;

        const customerParamsArray = buildCustomerParamsArray(customerParams);

        const preparedFormValues = {
            accessKey: accessKeyFromForm || accessKey,
            name,
            serviceProvider,
            billerId,
            customerParams: customerParamsArray,
        };

        setFormValues(preparedFormValues);

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

    const updateBeneficiaryStatus = async (payload: any) => {
        setButtonLoader(true);
        const data: SuccessGenericResponse<any> | false = await updateBeneficiaryStatusApi(payload);
        setButtonLoader(false);
        if (data && data.status) {
            return true;
        }
        return false;
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
        updateBeneficiaryStatus,
    };
}
