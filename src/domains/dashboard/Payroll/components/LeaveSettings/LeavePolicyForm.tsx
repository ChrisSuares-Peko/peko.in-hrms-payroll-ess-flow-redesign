import React from 'react';

import { Form } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import {
    applicableGenderOptions,
    leaveAccrualTypes,
    leaveCarryOverOptions,
} from '../../utils/orgSettings/data';

interface LeavePolicyFormProps {
    selectedRecordData?: any | null;
}

const LeavePolicyForm = ({ selectedRecordData }: LeavePolicyFormProps) => {
    const { values } = useFormikContext<any>();
    return (
        <Form layout="vertical">
            <TextInput
                name="leaveType"
                type="text"
                placeholder="Enter leave type"
                label="Leave Type"
                isRequired
                maxLength={50}
                allowAlphabetsAndSpaceOnly
            />
            <SelectInput
                name="accrualType"
                options={leaveAccrualTypes || []}
                placeholder="Select accrual type"
                label="Accrual Type"
                isRequired
            />
            {['MONTHLY', 'DAILY', 'YEARLY'].includes(values.accrualType) && (
                <TextInput
                    name="accrualRate"
                    type="text"
                    placeholder="Enter accrual rate"
                    label="Accrual Rate"
                    allowTwoDecimalsOnly
                    maxLength={4}
                    isRequired
                />
            )}
            {['MONTHLY', 'DAILY', 'YEARLY'].includes(values.accrualType) && (
                <TextInput
                    name="maximumAccrual"
                    type="text"
                    placeholder="Enter maximum accrual"
                    label="Maximum Accrual"
                    isRequired
                    allowNumbersOnly
                    maxLength={2}
                />
            )}
            <SelectInput
                name="leaveBalanceCarryover"
                options={leaveCarryOverOptions || []}
                placeholder="Select leave balance carryover"
                label="Leave Balance Carryover"
                isRequired
            />
            <TextInput
                name="maximumNumberOfLeaves"
                type="text"
                placeholder="Enter maximum no of leaves"
                label="Maximum Number of Leaves"
                isRequired
                allowNumbersOnly
                maxLength={4}
            />
            <SelectInput
                name="applicableGender"
                options={applicableGenderOptions}
                placeholder="Select applicable gender"
                label="Applicable Gender"
                isRequired
            />
        </Form>
    );
};

export default LeavePolicyForm;
