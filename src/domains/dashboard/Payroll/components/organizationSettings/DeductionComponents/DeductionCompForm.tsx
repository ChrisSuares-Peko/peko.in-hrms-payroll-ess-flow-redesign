import React from 'react';

import {  Form, } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import {
    deductionAmountCategories,
    deductionCompStatus,
    deductionTypes,
} from '../../../utils/orgSettings/data';

interface DeductionCompFormProps {
    selectedRecordData?: null;
    employeeIdFromProfile?: string;
}

const DeductionCompForm = ({
    selectedRecordData,
    employeeIdFromProfile,
}: DeductionCompFormProps) => {
    const { values } = useFormikContext<any>();
    const isProvidentFund = values.deductionName?.trim().toLowerCase() === 'provident fund (pf)';

    return (
        <Form layout="vertical">
            <TextInput
                name="deductionName"
                type="text"
                placeholder="Enter deduction name"
                label="Deduction Name"
                allowAlphabetsAndSpecialCharacters={['(', ')', '-', '_', '/', '&']}
                maxLength={50}
                isRequired
                isDisabled={isProvidentFund}
            />

            <SelectInput
                name="calculationType"
                options={deductionAmountCategories || []}
                placeholder="Select calculation type"
                label="Calculation Type"
                isRequired
            />
            {values.calculationType === 'FIXED' && (
                <TextInput
                    name="amountPercentage"
                    type="text"
                    placeholder="Enter amount "
                    label="Amount"
                    isRequired
                />
            )}
            {values.calculationType === 'PERCENTAGE' && (
                <TextInput
                    name="amountPercentage"
                    type="text"
                    placeholder="Enter percentage "
                    label="Percentage"
                    isRequired
                />
            )}
            {values.calculationType === 'PERCENTAGE' && (
                <SelectInput
                name="salaryDeductionType"
                options={deductionTypes || []}
                placeholder="Select deduction type"
                label="Deduction Type"

                isRequired
            />
            )}
            <SelectInput
                name="status"
                options={deductionCompStatus || []}
                placeholder="Select status"
                label="Status"
                isRequired
                isDisabled={isProvidentFund}
            />
            <TextInput
                name="applicabilityCriteria"
                type="text"
                placeholder="Enter applicability criteria (Optional)"
                label="Applicability Criteria (Optional)"
                isRequired={false}
            />
        </Form>
    );
};

export default DeductionCompForm;
