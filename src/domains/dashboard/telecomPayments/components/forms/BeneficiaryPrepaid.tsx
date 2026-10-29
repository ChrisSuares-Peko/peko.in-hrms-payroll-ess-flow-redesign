import React, { useEffect, useRef } from 'react';

import { FormikProps, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import SearchSelectInput from '@src/domains/dashboard/billPayments/components/CustomSelectSearch';
import { accessKeys } from '@utils/accessKeys';

import useGeneralApi from '../../hooks/useGeneralApi';
import useGetNumberDetails from '../../hooks/useGetNumberDetails';
import useMobileRechargeProviders from '../../hooks/useMobileRechargeProviders';

interface BeneficiaryFormProps {
    service: string;
    onLoadingChange?: (loading: boolean) => void;
}

const AddBeneficiaryPrepaid = ({ service, onLoadingChange }: BeneficiaryFormProps) => {
    const { stateData } = useGeneralApi();
    const { prepaidProviders } = useMobileRechargeProviders();
    const { values, setFieldValue, validateField }: FormikProps<any> = useFormikContext(); // Access form values
    const mobileNumber = values.phoneNo;
    const hasEdited = useRef(false);
    const serviceProviderRef = useRef(values.serviceProvider);
    serviceProviderRef.current = values.serviceProvider;

    const { getNumberData, numberData, isLoading } = useGetNumberDetails(mobileNumber);

    useEffect(() => {
        if (hasEdited.current && mobileNumber?.length === 10) {
            getNumberData();
        }
    }, [getNumberData, mobileNumber?.length]);

    useEffect(() => {
        if (hasEdited.current) {
            onLoadingChange?.(isLoading);
        }
    }, [isLoading, onLoadingChange]);

    useEffect(() => {
        if (numberData) {
            const matchedProvider = prepaidProviders.find(
                opt => opt.label.toLowerCase() === numberData.CurrentOperator?.toLowerCase()
            );
            const matchedCircle = stateData?.find(
                opt => opt.label.toLowerCase() === numberData.CurrentLocation?.toLowerCase()
            );
            setFieldValue('serviceProvider', matchedProvider?.value || numberData.CurrentOperator);
            setTimeout(() => {
                validateField('serviceProvider');
            }, 0);
            setFieldValue('providerCircle', matchedCircle?.value || numberData.CurrentLocation);
            setTimeout(() => {
                validateField('providerCircle');
            }, 0);
            setFieldValue('phoneNo', numberData.MobileNo);
        } else {
            const providerExists = prepaidProviders.find(
                p => p.value === serviceProviderRef.current
            );
            if (!providerExists) {
                setFieldValue('serviceProvider', '');
            }
            setFieldValue('accessKey', accessKeys.prepaid);
        }
    }, [numberData, stateData, setFieldValue, validateField, prepaidProviders]);
    return (
        <>
            <TextInput
                name="phoneNo"
                label="Mobile Number"
                type="text"
                placeholder="Example: 9896XXXXXX"
                allowNumbersOnly
                maxLength={10}
                isRequired
                handleChange={() => {
                    hasEdited.current = true;
                }}
            />
            <SelectInput
                name="serviceProvider"
                label="Service Provider"
                placeholder="Select Service Provider"
                options={prepaidProviders}
                isRequired
            />
            <SearchSelectInput
                name="providerCircle"
                label="Select Circle"
                options={stateData || []}
                placeholder="Select Circle"
                isRequired
            />
        </>
    );
};

export default AddBeneficiaryPrepaid;
