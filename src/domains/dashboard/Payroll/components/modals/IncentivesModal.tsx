import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import useIncentivesCreate from '../../hooks/employeeSalaryHooks/incentivesHooks/useAddIncentiveApi';
import { useUpdateIncentive } from '../../hooks/employeeSalaryHooks/incentivesHooks/useUpdateIncentiveApi';
import { payrollIncentivesSchema } from '../../schema/EmployeeSalary';
import { incentiveTable } from '../../types/salaryProfileTypes/incentiveTypes';

interface IncentivesModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRowData?: incentiveTable | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month: number;
    year: number;
}

const IncentivesModal = ({
    open,
    handleCancel,
    selectedRowData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: IncentivesModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee(month, year);
    const { handleIncentivesCreation, isAdding } = useIncentivesCreate();
    const { updateIncentiveId, isUpdating } = useUpdateIncentive();

    const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month');

    const handleFormSubmit = async (values: any) => {
        if (selectedRowData) {
            await updateIncentiveId({ id: selectedRowData.id, ...values });
        } else {
            await handleIncentivesCreation(values);
        }

        handleCancel();

        if (reloadTable) reloadTable(p => !p);
    };

    const { details, effectiveMonth, incentiveAmount } = selectedRowData || {};

    return (
        <CustomModalWithForm
            modalTitle={selectedRowData ? 'Edit incentive' : 'Add incentives'}
            open={open}
            isLoading={selectedRowData ? isUpdating : isAdding}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                employeeId: employeeIdFromProfile || '',
                incentiveDate: effectiveMonth || '',
                details: details || '',
                amount: incentiveAmount || '',
            }}
            validationSchema={payrollIncentivesSchema}
            reinitialise
        >
            {({ values }) => {
                const selectedEmployee = data?.find(
                    emp => emp.id === values.employeeId
                );

                const joiningDate = selectedEmployee?.employeeInformation?.dateOfJoin
                    ? dayjs(selectedEmployee.employeeInformation.dateOfJoin)
                    : null;

                // Only floored at the employee's joining date (can't backdate before they
                // existed) — not at the start of the currently-viewed payroll month, so a
                // backdated incentive for an earlier month (e.g. entering it late) is
                // possible, mirroring Revise Salary's own unrestricted Effective Month
                // picker. Still capped at the end of the currently-viewed month via
                // maxDate below, so a FUTURE month can't be picked from here.
                const minDate =
                    joiningDate && joiningDate.isValid() ? joiningDate.startOf('day') : undefined;
                return (
                    <Form layout="vertical">
                        {!selectedRowData && !employeeIdFromProfile ? (
                            <SelectInputWithSearch
                                name="employeeId"
                                options={generateEmployeesDropdown(data) || []}
                                placeholder="Select employee"
                                label="Employee name"
                                isRequired
                                handleChange={eid => {
                                    generateEmployeesDropdown(data).find(
                                        emp => emp.value === eid
                                    );
                                }}
                            />
                        ) : (
                            ''
                        )}

                        <DatePickerInput
                            name="incentiveDate"
                            label="Effective Month"
                            placeholder="Select effective month"
                            classes="w-full"
                            needConfirm={false}
                            isRequired
                            minDate={minDate}
                            maxDate={endOfMonth}
                        />

                        <TextInput
                            name="amount"
                            type="text"
                            label="Incentives Amount"
                            placeholder="Enter incentives amount"
                            isRequired
                            allowTwoDecimalsOnly
                            maxLength={6}
                        />

                        <TextInput
                            name="details"
                            type="text"
                            label="Details"
                            placeholder="Enter details"
                            isRequired
                            maxLength={50}
                            allowAlphabetsSpaceAndNumbersOnly
                        />
                    </Form>
                );
            }}
        </CustomModalWithForm>
    );
};

export default IncentivesModal;
