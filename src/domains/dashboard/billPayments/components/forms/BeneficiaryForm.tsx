import React, { useEffect } from 'react';

import { Form } from 'antd';
import { FormikProps, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { accessKeys } from '@utils/accessKeys';

import ServiceProviderSelect from './ServiceProviderSelect';
import useServiceProviderApi from '../../hooks/useServiceProviderApi';
import { setFormInitialValues } from '../../slices/beneficiary';
import { BeneficiaryFormProps, UserEnteredFormValues } from '../../types/index';
import {
    CHALLAN_VEHICLE_LABEL,
    CHALLAN_VEHICLE_PARAM,
    beneficiaryServiceOptions,
    deriveParamsFromSaved,
    formatParamLabel,
} from '../../utils/beneficiaryForm';
import { billPayments, isMobileLikeParam } from '../../utils/data';

const BeneficiaryForm = ({
    service,
    setService,
    accessKeyName,
    selectedBillerData,
    setSelectedBillerData,
    editValues,
}: BeneficiaryFormProps) => {
    const dispatch = useAppDispatch();
    const formik = useFormikContext<UserEnteredFormValues>();
    const bbpsServiceCategory = billPayments.find(
        obj => obj.accessKey === service
    )?.BBPSCategoryName;
    const [isServiceChanging, setIsServiceChanging] = React.useState(false);
    const [hasInitializedEdit, setHasInitializedEdit] = React.useState(false);

    // LPG beneficiary: any mobile-like customer-param must be pinned to the Peko account holder's
    // registered mobile (pre-filled, non-editable, with a tooltip) — same rule as the LPG payment form.
    const userMobile = useAppSelector(state => state.reducer.user.user?.mobileNo) || '';
    const isLpg = service === accessKeys.lpg;
    // Traffic Challan is a Droom product, not a BBPS biller: no service-provider step, only the
    // vehicle number (same shape the Traffic Challan page's own drawer saves).
    const isChallan = service === accessKeys.challan;

    const {
        serviceProviderData,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMoreServiceProviders,
        handleServiceProviderSearch,
        resetSearchIfDirty,
    } = useServiceProviderApi(isChallan ? undefined : bbpsServiceCategory);

    // Carry the typed name/service through the Formik re-initialise that follows a field-set change.
    const syncInitialValues = (accessKey: string, billerId = '', serviceProvider = '') =>
        dispatch(
            setFormInitialValues({ accessKey, name: formik.values.name, billerId, serviceProvider })
        );
    const handleChange = (value: string, labelName: any) => {
        setIsServiceChanging(false);
        setHasInitializedEdit(true); // User has picked — stop the edit-resolution effect from overwriting.
        const selectedOption = serviceProviderData?.find(opt => opt.value === value);
        setSelectedBillerData(selectedOption?.customerParams!);
        syncInitialValues(formik.values.accessKey, value, labelName?.label);
    };
    const selectChallan = () => {
        setIsServiceChanging(false);
        setSelectedBillerData([CHALLAN_VEHICLE_PARAM]);
        syncInitialValues(accessKeys.challan);
    };

    useEffect(() => {
        setHasInitializedEdit(false);
        setSelectedBillerData([]);
    }, [editValues?.id, setSelectedBillerData]);

    useEffect(() => {
        if (accessKeyName) setService(accessKeyName);
        if (editValues) {
            setService(editValues?.accessKey);
            setIsServiceChanging(false);
        }
        if (!editValues || hasInitializedEdit) return;
        if (editValues.accessKey === accessKeys.challan) {
            setSelectedBillerData([CHALLAN_VEHICLE_PARAM]);
            setHasInitializedEdit(true);
        } else if (!isLoading) {
            // Resolve the saved provider's input fields once the provider list settles. Prefer the
            // matched biller's real param definitions; if it isn't on the loaded page, derive them from
            // the saved customerParams so the fields still render without a manual re-select.
            const selectedOption = serviceProviderData?.find(
                opt => opt.value === editValues.billerId
            );
            setSelectedBillerData(
                selectedOption
                    ? selectedOption.customerParams ?? []
                    : deriveParamsFromSaved(editValues.customerParams)
            );
            setHasInitializedEdit(true);
        }
    }, [accessKeyName, editValues, serviceProviderData, hasInitializedEdit, isLoading, setSelectedBillerData, setService]);
    const { setFieldValue, validateField }: FormikProps<any> = useFormikContext() ?? {};

    // Force Formik state to the current user mobile for every mobile-like LPG param. This runs after
    // selectedBillerData populates AND after edit-mode pre-fill, so a saved beneficiary's old mobile
    // is overwritten by the current account holder's mobile before submission.
    useEffect(() => {
        if (!isLpg || !userMobile || !selectedBillerData?.length) return;
        selectedBillerData.forEach(input => {
            if (isMobileLikeParam(input.paramName)) {
                setFieldValue(input.paramName, userMobile);
            }
        });
    }, [isLpg, userMobile, selectedBillerData, setFieldValue]);

    return (
        <Form layout="vertical">
            {!accessKeyName && (
                <SelectInput
                    name="accessKey"
                    label="Select Service"
                    placeholder="Select Service"
                    options={beneficiaryServiceOptions}
                    isRequired
                    showSearch
                    filterOption={(input, option) => {
                        const label = option?.children?.toString().toLowerCase() || '';
                        return label.includes(input.toLowerCase());
                    }}
                    handleChange={e => {
                        setService(e);
                        formik.setFieldValue('accessKey', e);
                        formik.setFieldValue('billerId', '');
                        setFieldValue('accessKey', e);
                        if (e === accessKeys.challan) selectChallan();
                        else setIsServiceChanging(true);
                        setTimeout(() => {
                            validateField('accessKey');
                        }, 0);
                    }}
                />
            )}
            <TextInput
                name="name"
                label="Beneficiary Name"
                type="text"
                placeholder="Example: Jhoxxx"
                isRequired
                maxLength={50}
            />
            {service && !isChallan && (
                <ServiceProviderSelect
                    options={serviceProviderData || []}
                    savedBillerId={editValues?.billerId}
                    savedProviderName={editValues?.serviceProvider}
                    isLoading={isLoading || isLoadingMore}
                    hasMore={hasMore}
                    showSkeleton={isLoading && !!editValues && !hasInitializedEdit}
                    onChange={handleChange}
                    onSearch={handleServiceProviderSearch}
                    onLoadMore={loadMoreServiceProviders}
                    onOpen={resetSearchIfDirty}
                />
            )}
            {!isServiceChanging &&
                selectedBillerData?.map((input, i) => {
                    const shouldLockToUserMobile = isLpg && isMobileLikeParam(input.paramName);
                    const isVehicleField =
                        isChallan && input.paramName === CHALLAN_VEHICLE_PARAM.paramName;
                    const label = isVehicleField
                        ? CHALLAN_VEHICLE_LABEL
                        : formatParamLabel(input.paramName);
                    return (
                        <TextInput
                            label={label}
                            name={input.paramName}
                            placeholder={`Enter ${label}`}
                            type="text"
                            key={i}
                            allowNumbersOnly={input.dataType === 'NUMERIC'}
                            allowAlphabetsAndNumbersOnly={isVehicleField}
                            convertToUppercase={isVehicleField}
                            isRequired={input.isOptional === 'false'}
                            maxLength={input.maxLength || 20}
                            isDisabled={shouldLockToUserMobile}
                            values={shouldLockToUserMobile ? userMobile : undefined}
                            showToolTip={shouldLockToUserMobile}
                            tooltipText={shouldLockToUserMobile ? 'Only your registered mobile number can be used here.' : undefined}
                        />
                    );
                })}
        </Form>
    );
};

export default BeneficiaryForm;
