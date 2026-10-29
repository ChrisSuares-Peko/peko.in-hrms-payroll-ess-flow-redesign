/* eslint-disable react/no-unused-prop-types */
import { DatePicker, Divider, Form, Input, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { useField } from 'formik';

import { RenewalFormSection } from '../../hooks/useRenewalFormConfig';
import CustomFileUpload from '../atomic/CustomFileUpload';

interface FieldProps {
    name: string;
    label: string;
    placeholder?: string;
    description?: string;
    type: 'text' | 'email' | 'number' | 'date' | 'file';
    required?: boolean;
}

function TextField({ name, label, placeholder, description, type, required }: FieldProps) {
    const [field, meta, helpers] = useField(name);
    return (
        <Form.Item
            label={label}
            required={required}
            validateStatus={meta.touched && meta.error ? 'error' : ''}
            help={meta.touched && meta.error ? meta.error : description}
        >
            {type === 'number' ? (
                <InputNumber
                    style={{ width: '100%' }}
                    value={field.value === '' || field.value == null ? null : Number(field.value)}
                    placeholder={placeholder}
                    onChange={val => helpers.setValue(val ?? '')}
                    onBlur={() => helpers.setTouched(true)}
                />
            ) : (
                <Input
                    type={type === 'email' ? 'email' : 'text'}
                    value={field.value ?? ''}
                    placeholder={placeholder}
                    onChange={e => helpers.setValue(e.target.value)}
                    onBlur={() => helpers.setTouched(true)}
                />
            )}
        </Form.Item>
    );
}

function DateField({ name, label, description, required }: FieldProps) {
    const [field, meta, helpers] = useField(name);
    return (
        <Form.Item
            label={label}
            required={required}
            validateStatus={meta.touched && meta.error ? 'error' : ''}
            help={meta.touched && meta.error ? meta.error : description}
        >
            <DatePicker
                style={{ width: '100%' }}
                value={field.value ? dayjs(field.value) : null}
                onChange={d => helpers.setValue(d ? d.toISOString() : '')}
                onBlur={() => helpers.setTouched(true)}
            />
        </Form.Item>
    );
}

interface Props {
    sections: RenewalFormSection[];
}

export default function DynamicRenewalFields({ sections }: Props) {
    if (!sections?.length) return null;

    return (
        <div className="flex flex-col gap-3">
            {sections.map(section => (
                <div key={section.title} className="flex flex-col gap-2">
                    <Divider className="!my-2" orientation="left" orientationMargin="0">
                        <span className="text-sm font-semibold text-neutral-600">
                            {section.title}
                        </span>
                    </Divider>
                    {section.fields.map(field => {
                        const fieldName = `additional_fields.${field.name}`;
                        const required = !!field.validation?.required;

                        if (field.type === 'date') {
                            return (
                                <DateField
                                    key={field.name}
                                    name={fieldName}
                                    label={field.label}
                                    description={field.description}
                                    placeholder={field.placeholder}
                                    type={field.type}
                                    required={required}
                                />
                            );
                        }

                        if (field.type === 'file') {
                            return (
                                <CustomFileUpload
                                    key={field.name}
                                    name={fieldName}
                                    label={field.label}
                                    description={field.description}
                                    placeholder={field.placeholder}
                                    required={required}
                                />
                            );
                        }

                        return (
                            <TextField
                                key={field.name}
                                name={fieldName}
                                label={field.label}
                                description={field.description}
                                placeholder={field.placeholder}
                                type={field.type}
                                required={required}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
