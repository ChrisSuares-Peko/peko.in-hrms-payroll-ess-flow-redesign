import React from 'react';

import { Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

const PANVerificationForm: React.FC = React.memo(() => (
    <Form layout="vertical">
        <TextInput
            name="pan"
            label="PAN Number"
            placeholder="e.g. ABCDE1234F"
            type="text"
            isRequired
            convertToUppercase
            allowAlphabetsAndNumbersOnly
            maxLength={10}
        />
    </Form>
));

export default PANVerificationForm;
