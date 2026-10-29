import React, { useEffect, useMemo } from 'react';

import { Form } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { accessKeys } from '@utils/accessKeys';

import AddBeneficiaryPostpaid from './BeneficiaryPostpaid';
import AddBeneficiaryPrepaid from './BeneficiaryPrepaid';
import { Beneficiary, CustomerParam } from '../../types';
import { beneficiaryOptions as staticBeneficiaryOptions } from '../../utils/data';

interface BeneficiaryFormProps {
    service?: string;
    accessKeyName?: string;
    setService: React.Dispatch<React.SetStateAction<string | undefined>>;
    selectedBillerData: CustomerParam[];
    setSelectedBillerData: React.Dispatch<React.SetStateAction<CustomerParam[]>>;
    editValues?: Beneficiary | null;
    onNumberFetching?: (loading: boolean) => void;
}

const BeneficiaryForm = ({
    service,
    setService,
    accessKeyName,
    selectedBillerData,
    setSelectedBillerData,
    editValues,
    onNumberFetching,
}: BeneficiaryFormProps) => {
    const beneficiaryOptions = useMemo(() => staticBeneficiaryOptions, []);
    useEffect(() => {
        if (editValues?.accessKey) {
            setService(editValues.accessKey);
        }
    }, [editValues, setService]);
    const formik = useFormikContext();
    return (
        <Form layout="vertical">
            {!accessKeyName && (
                <SelectInput
                    name="accessKey"
                    label="Select Service"
                    placeholder="Select Service"
                    options={beneficiaryOptions}
                    handleChange={e => {
                        setService(e);
                        setSelectedBillerData([]);
                        formik.setFieldValue('billerId', '');
                        formik.setFieldValue('serviceProvider', '');
                        formik.setErrors({});
                        formik.setTouched({});
                    }}
                    isRequired
                />
            )}
            <TextInput
                name="name"
                label="Beneficiary Name"
                type="text"
                placeholder="Example: JoXXXX"
                allowBeneficiaryNameFormat
                maxLength={50}
                isRequired
            />

            {service === accessKeys.prepaid ? (
                <AddBeneficiaryPrepaid service={service} onLoadingChange={onNumberFetching} />
            ) : (
                <AddBeneficiaryPostpaid
                    accessKeyName={accessKeyName}
                    selectedBillerData={selectedBillerData}
                    setSelectedBillerData={setSelectedBillerData}
                    editValues={editValues}
                    service={service}
                />
            )}
            {/* {service && [accessKeys.postpaid, accessKeys.test].includes(service) && ( */}

            {/* )} */}
        </Form>
    );
};
export default BeneficiaryForm;
