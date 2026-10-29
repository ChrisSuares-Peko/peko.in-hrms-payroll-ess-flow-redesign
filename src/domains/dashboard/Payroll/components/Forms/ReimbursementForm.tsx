import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { removeEmoji } from '@utils/regex';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import { reimbursementTableType } from '../../types/salaryProfileTypes/ReimbursementTypes/index';
import {
    capitalizeFirstLetter,
    getAllowedStatusOptions,
    statusData,
} from '../../utils/salaryTable/reimbursement/data';

// Matches the categories offered on the ESS "Submit New Claim" modal exactly.
export const expenseCategoryOptions = [
    { value: 'Meals', label: 'Meals' },
    { value: 'Transport', label: 'Transport' },
    { value: 'Accommodation', label: 'Accommodation' },
    { value: 'Supplies', label: 'Supplies' },
    { value: 'Others', label: 'Others' },
];

interface ReimbursementFormProps {
    selectedRecordData?: reimbursementTableType | null;
    employeeIdFromProfile?: string;
    dateOfJoin?: string;
    dateOfJoined?: string;
    setDateOfJoin: (value: any) => void;
    month?: number;
    year?: number;
    // formik: FormikProps<any>;
}

const ReimbursementForm = ({
    selectedRecordData,
    employeeIdFromProfile,
    dateOfJoin,
    dateOfJoined,
    setDateOfJoin,
    month,
    year,
    // formik
}: ReimbursementFormProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee(month, year);
    const currentStatus = (selectedRecordData?.paymentStatus || 'UNPAID').toUpperCase();
    const allowedStatusOptions = getAllowedStatusOptions(currentStatus);
    const isFullyLocked = ['PAID', 'REJECTED'].includes(currentStatus);
    const isApproved = currentStatus === 'APPROVED';
    const canChangeStatus = currentStatus === 'UNPAID' || currentStatus === 'APPROVED';
    const isReadOnly = isFullyLocked || isApproved;
    const { validateField, setFieldValue } = useFormikContext<any>();

    return (
        <Form layout="vertical">
            {!selectedRecordData && !employeeIdFromProfile ? (
                <SelectInputWithSearch
                    name="employeeId"
                    options={generateEmployeesDropdown(data) || []}
                    placeholder="Select employee"
                    label="Employee Name"
                    isDisabled={isReadOnly}
                    isRequired
                    handleChange={eid => {
                        const employeeData = generateEmployeesDropdown(data).find(
                            emp => emp.value === eid
                        );
                        setDateOfJoin(employeeData?.dateOfJoin);
                        setFieldValue('employeeId', eid);
                        setFieldValue('expenseDate', null);
                        setTimeout(() => {
                            validateField('employeeId');
                        }, 0);
                        setTimeout(() => {
                            setFieldValue('employeeId', eid || ''); // Ensure empty value is valid
                            validateField('expenseDate');
                        }, 0);
                    }}
                />
            ) : (
                ''
            )}
            <DatePickerInput
                label="Expense Date"
                placeholder="Select expense date"
                isRequired
                isDisabled={isReadOnly}
                name="expenseDate"
                classes="w-full"
                needConfirm={false}
                minDate={dateOfJoined || dateOfJoin ? dayjs(dateOfJoined || dateOfJoin) : undefined}
                handleChange={date => {
                    setFieldValue('expenseDate', date);
                    setTimeout(() => {
                        validateField('expenseDate');
                    }, 0);
                }}
            />

            <TextInput
                name="managerEmail"
                label="Manager Email"
                type="text"
                isDisabled={isReadOnly}
                placeholder="Enter manager email"
                isRequired
                allowEmailsOnly
                maxLength={50}
                handleChange={val => {
                    const sanitizedValue = val.replace(removeEmoji, '');
                    setFieldValue('managerEmail', sanitizedValue);
                    // setTimeout(() => {
                    //     validateField('managerEmail');
                    // }, 0);
                }}
            />
            <SelectInput
                name="category"
                label="Category"
                options={expenseCategoryOptions}
                placeholder="Select category"
                isRequired
                isDisabled={isReadOnly}
            />
            <TextInput
                name="description"
                label="Description"
                type="text"
                isDisabled={isReadOnly}
                placeholder="Briefly describe the expense"
                maxLength={300}
                handleChange={val => {
                    const sanitizedValue = val.replace(/[^a-zA-Z0-9 &-.,()]/g, '');
                    setFieldValue('description', sanitizedValue);
                    setTimeout(() => {
                        validateField('description');
                    }, 0);
                }}
            />
            <TextInput
                name="totalPay"
                label="Reimbursement Amount (₹)"
                type="text"
                placeholder="Enter reimbursement amount"
                isRequired
                allowNumbersOnly
                allowTwoDecimalsOnly
                isDisabled={isReadOnly}
                maxLength={10}
                // handleChange={val => {
                //     setFieldValue('totalPay', val);
                //     setTimeout(() => {
                //         validateField('totalPay');
                //     }, 0);
                // }}
            />
            <SelectInput
                name="paymentStatus"
                label="Status"
                options={
                    selectedRecordData
                        ? [
                              { value: currentStatus, label: capitalizeFirstLetter(currentStatus) },
                              ...allowedStatusOptions,
                          ]
                        : statusData
                }
                placeholder="Select status"
                isRequired
                isDisabled={!canChangeStatus || allowedStatusOptions.length === 0}
            />

            <FileUploadInput
                label="Upload File (If any)"
                name="supportingDocs"
                format="supportingDocFormat"
                showFileName
                isDisabled={isReadOnly}
                allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                subLabel="(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)"
                allowFileDelete
                maxFileSize={5 * 1024}
            />
        </Form>
    );
};

export default ReimbursementForm;
