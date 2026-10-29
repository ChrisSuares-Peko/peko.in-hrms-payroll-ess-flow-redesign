import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import useOvertimeCreate from '../../hooks/employeeSalaryHooks/overtimeHooks/useAddOvertimeApi';
import GetOvertimeAmount from '../../hooks/employeeSalaryHooks/overtimeHooks/useCalculateOvertimeApi';
import { useUpdateOvertime } from '../../hooks/employeeSalaryHooks/overtimeHooks/useUpdateOvertimeApi';
import { payrollOvertimeSchema } from '../../schema/EmployeeSalary';
import { overtimeTable } from '../../types/salaryProfileTypes/overtimeTypes';

interface OverTimeModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRowData?: overtimeTable | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    year: number;
    month: number;
}

const OverTimeModal = ({
    open,
    handleCancel,
    selectedRowData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: OverTimeModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee(month, year);
    const { handleOvertimeCreation ,isCreating} = useOvertimeCreate();
    const { updateOvertimeId ,isUpdating} = useUpdateOvertime();
    const { getOvertimeDetails } = GetOvertimeAmount();
    const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month');
    const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month');
    const maxDate = dayjs().isBefore(endOfMonth) ? dayjs() : endOfMonth;
    // const smartMinDate =
    //     dayjs().month() + 1 === month && dayjs().year() === year
    //         ? dayjs()
    //         : startOfMonth;
    const debouncedGetOvertimeDetails = debounce(
        async (employeeId, extraHours, overTimeRate, setFieldValue) => {
            if (employeeId && extraHours && overTimeRate) {
                const overTimeData = await getOvertimeDetails(employeeId, extraHours, overTimeRate);
                if (overTimeData) {
                    setFieldValue('overTimeAmount', overTimeData.overtimeAmount);
                    setFieldValue('hourlyRate', overTimeData.hourlyRate);
                    setFieldValue('totalWorkingHours', overTimeData.totalWorkingHours);
                }
            }
        },
        300
    );
    const handleFormSubmit = async (values: any) => {
        if (selectedRowData) {
            await updateOvertimeId(values, selectedRowData);
        } else {
            await handleOvertimeCreation(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    const { extraHours, overTimeRate, totalWorkingHours, overTimeAmount, salaryMonth, hourlyRate } =
        selectedRowData || {};

    return (
        <CustomModalWithForm
            modalTitle={selectedRowData ? 'Edit Overtime' : 'Add overtime'}
            open={open}
            isLoading={selectedRowData ? isUpdating : isCreating}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                employeeId: employeeIdFromProfile || '',
                overTimeDate: salaryMonth || '',
                extraHours: extraHours || '',
                overTimeRate: overTimeRate || '',
                totalWorkingHours: totalWorkingHours || '',
                hourlyRate: hourlyRate || '',
                overTimeAmount: overTimeAmount || '',
            }}
            validationSchema={payrollOvertimeSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => {
                const selectedEmployee = data?.find(emp => emp.id === values.employeeId);
                const joiningDate = selectedEmployee?.employeeInformation?.dateOfJoin
                    ? dayjs(selectedEmployee.employeeInformation.dateOfJoin)
                    : null;
                const computedMinDate =
                    joiningDate && joiningDate.isValid() && joiningDate.isAfter(startOfMonth)
                        ? joiningDate.startOf('day')
                        : startOfMonth;
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
                            
                                debouncedGetOvertimeDetails(
                                    eid,
                                    values.extraHours,
                                    values.overTimeRate,
                                    setFieldValue
                                );
                            }}
                        />
                    ) : (
                        ''
                    )}

                    <DatePickerInput
                        name="overTimeDate"
                        label="Overtime Date"
                        placeholder="Enter overtime date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                        minDate={computedMinDate}
                        maxDate={maxDate}
                    />
                    <TextInput
                        name="extraHours"
                        type="text"
                        placeholder="Enter extra hours"
                        label="Extra Hours"
                        isRequired
                        allowTwoDecimalsOnly
                        handleChange={async extraHourValue => {
                            debouncedGetOvertimeDetails(
                                values.employeeId,
                                extraHourValue,
                                values.overTimeRate,
                                setFieldValue
                            );
                        }}
                        maxLength={3}
                    />
                    <TextInput
                        name="overTimeRate"
                        type="text"
                        label="Overtime Rate"
                        placeholder="Enter overtime rate"
                        isRequired
                        allowTwoDecimalsOnly
                        handleChange={async overTimeRateValue => {
                            debouncedGetOvertimeDetails(
                                values.employeeId,
                                values.extraHours,
                                overTimeRateValue,
                                setFieldValue
                            );
                        }}
                        maxLength={6}
                        showToolTip
                        tooltipText="The overtime rate is the increased pay rate employees receive for hours worked beyond their normal working hours. For example, the overtime rate can be provided as 1.5 which means it is 1.5 times (150%) the employee's regular hourly rate."
                    />
                    {values.hourlyRate && values.overTimeAmount ? (
                        <>
                            <TextInput
                                name="hourlyRate"
                                type="text"
                                label="Hourly Rate"
                                isDisabled
                                isRequired
                            />
                            <TextInput
                                name="overTimeAmount"
                                type="text"
                                label="Overtime Amount"
                                isDisabled
                                isRequired
                            />
                        </>
                    ) : (
                        ''
                    )}
                </Form>
                );
            }}
        </CustomModalWithForm>
    );
};
export default OverTimeModal;
