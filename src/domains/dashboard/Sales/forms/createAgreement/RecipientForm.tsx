import React, { useEffect, useRef } from 'react';

import { Form } from 'antd';
import { useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

export interface RecipientFormValues {
    name: string;
    email: string;
    phone: string;
}

interface RecipientFormProps {
    onValuesChange?: (values: RecipientFormValues) => void;
}

const RecipientForm: React.FC<RecipientFormProps> = ({ onValuesChange }) => {
    const { handleSubmit, values } = useFormikContext<RecipientFormValues>();
    const prevValuesRef = useRef<RecipientFormValues>(values);

    useEffect(() => {
        // Only call onValuesChange if values actually changed
        const hasChanged = 
            prevValuesRef.current.name !== values.name ||
            prevValuesRef.current.email !== values.email ||
            prevValuesRef.current.phone !== values.phone;
        
        if (hasChanged) {
            prevValuesRef.current = values;
            onValuesChange?.(values);
        }
    }, [values, onValuesChange]);

    return (
        <Form layout="vertical" onFinish={handleSubmit} className="w-full">
            <TextInput
                name="name"
                label="Customer Name"
                placeholder="Enter Customer Name"
                type="text"
                isRequired
            />
            <TextInput
                name="email"
                label="Customer Email"
                placeholder="Enter Email"
                type="text"
                isRequired
                allowEmailsOnly
            />
            <TextInput
                name="phone"
                label="Phone Number (Optional)"
                placeholder="Phone Number"
                type="text"
                allowNumbersOnly
                maxLength={15}
            />
        </Form>
    );
};

export default React.memo(RecipientForm);
