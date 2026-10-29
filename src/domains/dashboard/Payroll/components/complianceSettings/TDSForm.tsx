import React from 'react';

import { Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { LeaveTableRow } from '../../types/leaveSection';

interface TDSFormProps {
    selectedRecordData?: LeaveTableRow | null;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const TDSForm = ({ selectedRecordData, employeeIdFromProfile, month, year }: TDSFormProps) => (
        <Form layout="vertical">
            <SelectInput
                name="year"
                options={[]}
                placeholder="Select year"
                label="Year"
                isRequired
            />
            <SelectInput
                name="month"
                options={[]}
                placeholder="Select month"
                label="Month"
                isRequired
            />
            <SelectInput
                name="employeeName"
                options={[]}
                placeholder="Select employee"
                label="Employee Name"
                isRequired
            />
            <TextInput
                name="tdsAmount"
                type="text"
                placeholder="Enter TDS amount"
                label="TDS Amount"
                isRequired
            />
        </Form>
    );

export default TDSForm;
