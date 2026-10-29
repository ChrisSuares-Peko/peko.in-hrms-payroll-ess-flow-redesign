import React, { useState } from 'react';

import { Form, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import { useAvailableLeavePoliciesApi } from '../../hooks/leavesAndAttendanceHooks/useAvailableLeavePoliciesApi';
import { LeaveRequestFormType, LeaveTableRow } from '../../types/leaveSection';

interface LeaveFormProps {
    selectedRecordData?: LeaveTableRow | null;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
    getLeave:ReturnType<typeof useAvailableLeavePoliciesApi>['getLeave']
    leaves:ReturnType<typeof useAvailableLeavePoliciesApi>['leaves']
}

const LeaveForm = ({ selectedRecordData, employeeIdFromProfile, month, year,getLeave,leaves }: LeaveFormProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee(month, year);
    // const [isEmployeeSelected, setIsEmployeeSelected] = useState<boolean>(false);

    const { values, setFieldValue } = useFormikContext<LeaveRequestFormType>();
    const { dateOfJoin } = useAppSelector(state => state.reducer.payrollSalary);
    const [dateOfJoined, setDateOfJoin] = useState<string | undefined>();

    // useEffect(() => {
        
    //     if (employeeIdFromProfile) {
    //         getLeave(employeeIdFromProfile);
    //     }
    // }, [getLeave, employeeIdFromProfile]);
   
    return (
        <Form layout="vertical">
            {!selectedRecordData && !employeeIdFromProfile ? (
                <SelectInputWithSearch
                    name="employeeId"
                    options={generateEmployeesDropdown(data) || []}
                    placeholder="Select employee"
                    label="Employee name"
                    isRequired
                    disableDeselect
                    handleChange={e => {
                            getLeave(e);
                        // setIsEmployeeSelected(true);
                        const employeeData = generateEmployeesDropdown(data).find(
                            emp => emp.value === e
                        );
                        setDateOfJoin(employeeData?.dateOfJoin);
                    }}
                />
            ) : (
                ''
            )}
            <SelectInput
                name="typeOfLeave"
                options={leaves || []}
                handleChange={(e)=>{
                    const leaveValue = leaves.find((x)=>x.value===e)
                   console.log(leaveValue)
                   setFieldValue("typeOfLeaveValue",leaveValue?.label)
                }}
                placeholder="Select leave type"
                label="Leave Type"
                isRequired
            />

{values?.typeOfLeave  && (
                <Content className="ml-1 " style={{ marginTop: '-15px' }}>
                    <Typography.Text type="secondary">
                        {`Paid leaves left: ${leaves.find(item => item.value === values.typeOfLeave)?.balance || 0} days`}
                    </Typography.Text>
                </Content>
            )}

            <TextInput
                name='leaveCount'
                label="Leave Duration"
                values={values.leaveCount}
                type="text"
                placeholder="Enter duration"
                maxLength={4}
                allowNumbersOnly={!leaves.find((x)=>x.value===values.typeOfLeave)?.label.toLowerCase().includes("annual") && !leaves.find((x)=>x.value===values.typeOfLeave)?.label.toLowerCase().includes("sick")}
                allowedInputKeys={
                    (leaves.find((x)=>x.value===values.typeOfLeave)?.label.toLowerCase().includes("annual") || leaves.find((x)=>x.value===values.typeOfLeave)?.label.toLowerCase().includes("sick"))
                        ? (value) => {
                            let filtered = value.replace(/[^0-9.]/g, '');
                            filtered = filtered.replace(/(\..*?)\..*/g, '$1'); // remove extra dots
                            filtered = filtered.replace(/(\.)([^5])/g, '$1'); // after dot, only 5 allowed
                            filtered = filtered.replace(/(\.5)([^0])/g, '$1'); // after .5, only 0 allowed
                            filtered = filtered.replace(/(\.50)\d+/g, '$1'); // after .50, no more digits
                            if (filtered === '.') filtered = '0.';
                            return filtered;
                        }
                        : undefined
                }
                isRequired
                handleChange={e => {
                    const duration = parseFloat(e);
                    if (
                        duration > 0 &&
                        
                        (duration * 10) % 5 === 0 // Only allow .5 increments for logic (additional UX guard)
                    ) {
                        if(values.start){  
                            const fullDays = Math.ceil(duration);
                        const isHalf = duration % 1 === 0.5;
                        let endDate = dayjs(values.start).add(fullDays - 1, 'day');
                        if (isHalf) {
                            endDate = endDate.add(12, 'hour'); // Adds half a day
                        }
                        setFieldValue('end', endDate.format('YYYY-MM-DD'));
                    }
                    }
                   
                }}
            />
            {Number(values.leaveCount) === 0.5 && (
                <SelectInput
                    name="halfDaySelection"
                    label="Select Half Day"
                    placeholder="Select the half day"
                    options={[
                        { value: 'FIRST_HALF', label: 'First Half' },
                        { value: 'SECOND_HALF', label: 'Second Half' },
                    ]}
                    isRequired
                />
            )}
            <DatePickerInput
                label="Start Date"
                placeholder="Enter start date"
                isRequired
                name="start"
                classes="w-full"
                needConfirm={false}
                minDate={dayjs(dateOfJoined || dateOfJoin) > dayjs(new Date().setMonth(0)) ? dayjs(dateOfJoined || dateOfJoin) : dayjs(new Date().setMonth(0))}
                // isDisabled={!isEmployeeSelected}
                handleChange={date => {
                    const dur = Number(values.leaveCount) - 1;
                    const endDate = dayjs(date.toString())
                        .add(Number(dur), 'day')
                        .format('YYYY-MM-DD');
                    setFieldValue('end', endDate);
                }}
            />
            {values?.start && values?.leaveCount && (
                <DatePickerInput
                    label="End Date"
                    placeholder="Select end Date"
                    isRequired
                    name="end"
                    classes="w-full"
                    minDate={dayjs(values.start)}
                    needConfirm={false}
                />
            )}
        </Form>
    );
};

export default LeaveForm;
