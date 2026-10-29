import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

interface TextAreaProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    maxLength?: number;
}

const TextAreaComponent: React.FC<TextAreaProps> = ({
    name,
    label,
    placeholder,
    size,
    isDisabled,
    isRequired,
    maxLength,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors } }: FieldProps) => (
            <Form.Item
                label={label}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                help={touched[name] && errors[name] ? (errors[name] as React.ReactNode) : undefined}
            >
                <Input.TextArea
                    style={{ height: 85, resize: 'none' }}
                    className="rounded-sm"
                    {...field}
                    id={name}
                    size={size ?? 'middle'}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    maxLength={maxLength}
                />
            </Form.Item>
        )}
    </Field>
);

export default TextAreaComponent;
