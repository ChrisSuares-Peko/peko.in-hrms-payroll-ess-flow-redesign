import React from 'react';

import { Col } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

type LabWelfareFormProps = {};
const LabWelfareForm: React.FC<LabWelfareFormProps> = () => (
    <Col>
        <SelectInput
            name="state"
            options={[]}
            placeholder="Select state"
            label="State"
            isRequired
        />
        <TextInput
            name="PT Number"
            type="text"
            placeholder="Enter PT Number"
            label="PT Number"
            isRequired
            allowNumbersOnly
            maxLength={6}
        />
        <SelectInput
            name="deductionCycle"
            options={[]}
            placeholder="Select deduction cycle"
            label="Deduction Cycle"
            isRequired
        />
    </Col>
);

export default LabWelfareForm;
