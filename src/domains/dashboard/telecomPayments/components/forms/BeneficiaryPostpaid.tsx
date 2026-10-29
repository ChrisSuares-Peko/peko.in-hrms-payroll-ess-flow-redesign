import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Skeleton } from 'antd';
import { useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { BBPSCategoryName } from '@customtypes/general';
import SearchSelectInput from '@src/domains/dashboard/billPayments/components/CustomSelectSearch';
import { setFormInitialValues } from '@src/domains/dashboard/billPayments/slices/beneficiary';
import { UserEnteredFormValues } from '@src/domains/dashboard/billPayments/types';
import { useAppDispatch } from '@src/hooks/store';
import { accessKeys } from '@utils/accessKeys';

import useServiceProviderApi from '../../hooks/useServiceProviderApi';
import { Beneficiary, CustomerParam, CustomerValuesType } from '../../types';

// Build minimal field definitions from a beneficiary's saved customerParams so the inputs can render
// (and show their saved values) even when the provider isn't in the loaded biller list. Loose
// validation here is acceptable: the values were already valid when saved, and the real definitions
// take over the moment the user re-selects a provider.
const deriveParamsFromSaved = (saved?: CustomerValuesType[]): CustomerParam[] =>
    (saved ?? [])
        .map(param => {
            const paramName = param.name ?? param.paramName;
            if (!paramName) return null;
            return {
                paramName,
                values: param.value ?? param.paramValue ?? null,
                isOptional: 'true',
                maxLength: 0,
                minLength: 0,
                dataType: '',
                regex: '',
                visibility: true,
            } as CustomerParam;
        })
        .filter((param): param is CustomerParam => param !== null);

interface BeneficiaryFormProps {
    accessKeyName?: string;
    service?: string;
    selectedBillerData: CustomerParam[];
    setSelectedBillerData: React.Dispatch<React.SetStateAction<CustomerParam[]>>;
    editValues?: Beneficiary | null;
}

const BeneficiaryForm = ({
    accessKeyName,
    selectedBillerData,
    setSelectedBillerData,
    editValues,
    service,
}: BeneficiaryFormProps) => {
    const dispatch = useAppDispatch();
    const formik = useFormikContext<UserEnteredFormValues>();
    let categoryName: string | undefined;

    if (service === accessKeys.postpaid) {
        categoryName = BBPSCategoryName.postpaid;
    }

    if (service === accessKeys.test) {
        categoryName = BBPSCategoryName.test;
    }

    const { serviceProviderData, isLoading } = useServiceProviderApi(categoryName ?? '');
    const [hasInitializedEdit, setHasInitializedEdit] = useState(false);

    useEffect(() => {
        setHasInitializedEdit(false);
        setSelectedBillerData([]);
    }, [editValues?.id, setSelectedBillerData]);

    const handleChange = useCallback(
        (value: string, labelName: any) => {
            setHasInitializedEdit(true); // User has picked — stop the edit-resolution effect from overwriting.
            const selectedOption =
                serviceProviderData && serviceProviderData.find(opt => opt.value === value);
            setSelectedBillerData(selectedOption?.customerParams!);
            dispatch(
                setFormInitialValues({
                    accessKey: formik.values.accessKey,
                    name: formik.values.name,
                    billerId: value,
                    serviceProvider: labelName?.label,
                })
            );
        },
        [
            dispatch,
            formik.values.accessKey,
            formik.values.name,
            serviceProviderData,
            setSelectedBillerData,
        ]
    );

    // Surface a synthetic option carrying the saved provider name when the saved biller isn't in the
    // loaded list, so the Select shows the name instead of the raw billerId.
    const mergedProviderOptions = useMemo(() => {
        const options = serviceProviderData || [];
        if (!editValues?.billerId || options.some(opt => opt.value === editValues.billerId)) {
            return options;
        }
        return [
            {
                value: editValues.billerId,
                label: editValues.serviceProvider || editValues.billerId,
                customerParams: [],
            },
            ...options,
        ];
    }, [serviceProviderData, editValues?.billerId, editValues?.serviceProvider]);

    useEffect(() => {
        // Resolve the saved provider's input fields once the provider list settles. Prefer the matched
        // biller's real param definitions; if it isn't in the loaded list, derive them from the saved
        // customerParams so the fields still render and populate without a manual re-select.
        if (!editValues || hasInitializedEdit || isLoading) return;
        const selectedOption = serviceProviderData?.find(opt => opt.value === editValues.billerId);
        setSelectedBillerData(
            selectedOption
                ? (selectedOption.customerParams ?? []).filter(Boolean)
                : deriveParamsFromSaved(editValues.customerParams)
        );
        setHasInitializedEdit(true);
    }, [
        accessKeyName,
        editValues,
        serviceProviderData,
        hasInitializedEdit,
        isLoading,
        setSelectedBillerData,
    ]);
    return (
        <div data-testid="beneficiary-form">
            {isLoading && editValues && !hasInitializedEdit ? (
                <Form.Item label="Select Service Provider" required>
                    <Skeleton.Input active block />
                </Form.Item>
            ) : (
                <SearchSelectInput
                    name="billerId"
                    label="Select Service Provider"
                    options={mergedProviderOptions}
                    placeholder="Select Service Provider"
                    handleChange={handleChange}
                    isLoading={isLoading}
                    isRequired
                />
            )}

            {selectedBillerData?.filter(Boolean).map((input, i) => (
                <TextInput
                    label={input.paramName}
                    name={input.paramName}
                    placeholder={`${input.paramName}`}
                    allowNumbersOnly={input.dataType === 'NUMERIC'}
                    isRequired={input.isOptional === 'false'}
                    type="text"
                    key={i}
                    maxLength={input.maxLength || 20}
                />
            ))}
        </div>
    );
};

export default BeneficiaryForm;
