import React, { useEffect } from 'react';

import { Form, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import DocumentUploadInput from '@components/atomic/inputs/DocumentUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import { useAvailableLeaves } from '../../hooks/leaveHooks/useAvailableLeaveApi';
import { LeaveRequestFormType, LeaveTableRow } from '../../types/leaveSection';

interface BonusFormProps {
    selectedRecordData?: LeaveTableRow | null;
    employeeIdFromProfile?: string;
}

const BonusForm = ({ selectedRecordData, employeeIdFromProfile }: BonusFormProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { getLeave, leaves } = useAvailableLeaves();
    const { values, setFieldValue } = useFormikContext<LeaveRequestFormType>();

    useEffect(() => {
        if (selectedRecordData) {
            getLeave(selectedRecordData.employeeId);
        }
        if (employeeIdFromProfile) {
            getLeave(employeeIdFromProfile);
        }
    }, [getLeave, selectedRecordData, employeeIdFromProfile]);
    return (
        <Form layout="vertical">
            {!selectedRecordData && !employeeIdFromProfile ? (
                <SelectInput
                    name="employeeId"
                    options={generateEmployeesDropdown(data) || []}
                    placeholder="Select employee"
                    label="Employee name"
                    isRequired
                    handleChange={e => getLeave(e)}
                />
            ) : (
                ''
            )}
            <SelectInput
                name="typeOfLeave"
                options={leaves || []}
                placeholder="Select leave type"
                label="Type of Leave"
                isRequired
            />
            {values?.typeOfLeave && values?.typeOfLeave !== 'UNPAID' && (
                <Content className="mb-5">
                    <Typography.Text type="secondary">
                        Paid leaves left:{' '}
                        {leaves.find(item => item.value === values.typeOfLeave)?.count || 0} days
                    </Typography.Text>
                </Content>
            )}
            <TextInput
                name="leaveCount"
                label="Duration"
                type="text"
                placeholder="Enter duration"
                maxLength={3}
                allowNumbersOnly
                isRequired
                handleChange={e => {
                    const endDate = dayjs(values.start).add(Number(e), 'day').format('YYYY-MM-DD');
                    setFieldValue('end', endDate);
                }}
            />
            <DatePickerInput
                label="Start Date"
                placeholder="Enter start sate"
                isRequired
                name="start"
                classes="w-full"
                needConfirm={false}
                minDate={dayjs(new Date())}
                handleChange={date => {
                    const endDate = dayjs(date.toString())
                        .add(Number(values.leaveCount), 'day')
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
                    needConfirm={false}
                    isDisabled
                />
            )}
            <DocumentUploadInput
                label="Upload File (If any)"
                name="leaveSupportingDocs"
                format="supportingDocFormat"
                showNotification
                showFileName
            />
        </Form>
    );
};

export default BonusForm;
