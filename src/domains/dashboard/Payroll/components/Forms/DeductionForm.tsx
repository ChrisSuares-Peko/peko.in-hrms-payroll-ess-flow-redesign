import React from 'react';

import { Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import {
    DeductionFormType,
    deductionTableType,
    ONE_TIME_DEDUCTION_TYPES,
} from '../../types/salaryProfileTypes/deductionTypes';

interface deductionFormProps {
    selectedRecordData?: deductionTableType | null;
    employeeIdFromProfile?: string;
    month: number;
    year: number;
}

const deductionForOptions = ONE_TIME_DEDUCTION_TYPES.map(type => ({ label: type, value: type }));

// Add and Edit share the same fields — a typed one-time recovery for the selected month.
const DeductionForm = ({ selectedRecordData, employeeIdFromProfile, month, year }: deductionFormProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee(month, year);
    const { values } = useFormikContext<DeductionFormType>();
    const showEmployeeSelect = !selectedRecordData && !employeeIdFromProfile;

    return (
        <Form layout="vertical">
            <Typography.Paragraph className="text-sm" style={{ color: '#535862', marginBottom: 20 }}>
                Use this for one-time recoveries from an employee&apos;s pay, like a salary advance, loan
                instalment or fine.
            </Typography.Paragraph>

            {showEmployeeSelect && (
                <SelectInputWithSearch
                    name="employeeId"
                    options={generateEmployeesDropdown(data) || []}
                    placeholder="Select employee"
                    label="Employee name"
                    isRequired
                    handleChange={() => {}}
                />
            )}

            <SelectInput
                name="deductionFor"
                label="Deduction for"
                placeholder="Select what the deduction is for"
                options={deductionForOptions}
                isRequired
            />

            <TextInput
                name="note"
                label="Note"
                type="text"
                placeholder={values.deductionFor === 'Other' ? 'Describe the deduction' : 'Optional — printed on the payslip'}
                classes="rounded-sm"
                maxLength={200}
                isRequired={values.deductionFor === 'Other'}
            />

            <TextInput
                name="amount"
                label="Amount (₹)"
                type="text"
                placeholder="Enter amount in whole rupees"
                classes="rounded-sm"
                allowNumbersOnly
                maxLength={7}
                isRequired
            />
        </Form>
    );
};

export default DeductionForm;
