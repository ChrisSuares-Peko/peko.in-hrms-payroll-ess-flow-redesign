import React from 'react';

import { Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { useGetEmployeeSalaryComponent } from '../../hooks/OrganizationSettings/useGetEmployeeCurrentSalaryCompApi';
import { salaryAmountCategories, salaryCompStatus } from '../../utils/orgSettings/data';

interface SalaryComponent {
    id: string;
    componentName: string;
    calculationType: 'FIXED' | 'PERCENTAGE';
    calculationBasedOn?: string;
    amountPercentage?: string | number;
    status: string;
    isGlobal?: boolean;
    isPartOfGross?: boolean;
}

interface SalaryCompFormProps {
    selectedRecordData?: SalaryComponent | null;
}

const EmployeeSalaryCompModalForm = ({ selectedRecordData }: SalaryCompFormProps) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const { data, generateEmployeeSalaryCompDropdown } = useGetEmployeeSalaryComponent();
    
    const filteredCalculationBasisOptions = React.useMemo(() => {
        const options = generateEmployeeSalaryCompDropdown(data) || [];

        if (!selectedRecordData?.componentName) {
            return options;
        }

        const selectedName = selectedRecordData.componentName.toLowerCase();

        return options.filter(option => {
            const optionValue = option.label?.toLowerCase();
            const isMatch = optionValue === selectedName;
            return !isMatch;
        });
    }, [data, selectedRecordData, generateEmployeeSalaryCompDropdown]);

    const isBasicSalary = values.componentName?.trim().toLowerCase() === 'basic salary';
    // A Balancing component is org-level and always present by default (set up once, in
    // Payroll Settings > Salary Components) — an employee-specific override added here can
    // never create or become a second one.
    const calculationTypeOptions = (salaryAmountCategories || []).filter(option => option.value !== 'BALANCING');

    return (
        <Form layout="vertical">
            <TextInput
                name="componentName"
                type="text"
                placeholder="Enter component name"
                label="Component Name"
                isRequired
                maxLength={50}
                isDisabled={isBasicSalary}
                allowAlphabetsAndSpecialCharacters={['/', '-', '_', '&']}
            />

            <SelectInput
                name="calculationType"
                options={calculationTypeOptions}
                placeholder="Select calculation type"
                label="Calculation Type"
                isRequired
                isDisabled={isBasicSalary}
                handleChange={(value: string) => {
                    setFieldValue('calculationType', value);
                    setFieldValue('amountPercentage', '');
                    // This form only ever expresses "% of another existing component" (the
                    // Calculation Basis dropdown below picks that component) — 'COMPONENT'
                    // is the only calculationBasis this flow supports, unlike the org-level
                    // Salary Components form which also offers Gross/Basic directly. Without
                    // this, calculationBasis stays '' whenever Percentage is selected, which
                    // both fails salaryCompFormSchema's own required-for-PERCENTAGE check
                    // (blocking Submit outright) and, even if that passed, would make
                    // buildPayload silently drop the selected calculationBasedOn from the
                    // request since it's only forwarded when calculationBasis === 'COMPONENT'.
                    setFieldValue('calculationBasis', value === 'PERCENTAGE' ? 'COMPONENT' : '');
                }}
            />
            {values.calculationType === 'FIXED' && (
                <TextInput
                    name="amountPercentage"
                    type="text"
                    placeholder="Enter amount "
                    label="Amount"
                    isRequired
                    allowTwoDecimalsOnly
                    maxLength={10}
                />
            )}
            {values.calculationType === 'PERCENTAGE' && (
                <TextInput
                    name="amountPercentage"
                    type="text"
                    placeholder="Enter percentage "
                    label="Percentage"
                    isRequired
                    allowTwoDecimalsOnly
                    maxLength={6}
                />
            )}
            {values.calculationType === 'PERCENTAGE' && (
                <SelectInput
                    name="calculationBasedOn"
                    isDisabled={isBasicSalary}
                    options={filteredCalculationBasisOptions}
                    placeholder="Select calculation basis"
                    label="Calculation Basis"
                    isRequired
                />
            )}

            <SelectInput
                name="status"
                options={salaryCompStatus || []}
                placeholder="Select status"
                label="Status"
                isRequired
                isDisabled={values.componentName === 'Basic Salary'}
            />

            {!isBasicSalary && values.calculationType !== 'BALANCING' && (
                <Flex vertical className="mt-2">
                    <CheckboxInput
                        name="isPartOfGross"
                        checked={values.isPartOfGross !== false}
                        onChange={(e: any) => setFieldValue('isPartOfGross', e.target.checked)}
                    >
                        <Typography.Text className="text-sm">Part of Gross Salary</Typography.Text>
                    </CheckboxInput>
                    <Typography.Text type="secondary" className="text-xs">
                        Untick for a company-paid benefit that counts toward CTC but isn&apos;t part of monthly Gross
                        pay — it won&apos;t be included in ESI wages, monthly TDS, or the monthly payout.
                    </Typography.Text>
                </Flex>
            )}
        </Form>
    );
};

export default EmployeeSalaryCompModalForm;