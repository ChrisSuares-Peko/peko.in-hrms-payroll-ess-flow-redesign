import React from 'react';

import { Form, Select } from 'antd';
import { Field, FieldProps } from 'formik';

interface IecFreeTextTagsInputProps {
    name: string;
    label?: string;
    placeholder: string;
    isRequired?: boolean;
}

// IEC's "Others Details" (doc §3) is free text, not a pick-from-list dropdown — the user types
// their own value and presses Enter/comma to add it, and can add any number of them. Built as its
// own component rather than extending the shared MultiSelectInput, which every other Import/Export
// Details-style field on this page (and 10+ other forms) relies on as a real options dropdown.
const IecFreeTextTagsInput: React.FC<IecFreeTextTagsInputProps> = ({ name, label, placeholder, isRequired }) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue } }: FieldProps<string[]>) => (
            <Form.Item
                label={label}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                help={touched[name] && errors[name] ? (errors[name] as React.ReactNode) : undefined}
            >
                <Select
                    {...field}
                    mode="tags"
                    open={false}
                    suffixIcon={null}
                    placeholder={placeholder}
                    className="h-10"
                    allowClear
                    onChange={(selectedValues: string[]) => {
                        setFieldValue(name, selectedValues);
                    }}
                />
            </Form.Item>
        )}
    </Field>
);

export default IecFreeTextTagsInput;
