import { Form, Input } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, getIn } from 'formik';

interface CodeTextAreaProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    maxLength?: number;
    minRows?: number;
    maxRows?: number;
    showCount?: boolean;
}

// Like TextAreaInput but for raw code/markup: it does NOT run the value through the
// emoji filter, which strips `<` and `>` (Unicode math symbols, not punctuation) and
// would corrupt pasted SVG. Rendered monospaced for readability.
const CodeTextAreaInput: React.FC<CodeTextAreaProps> = ({
    name,
    label,
    placeholder,
    size,
    isDisabled,
    isRequired,
    maxLength,
    minRows = 3,
    maxRows = 6,
    showCount = false,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => {
            const error = getIn(errors, name);
            const isTouched = getIn(touched, name);

            return (
                <Form.Item
                    label={label}
                    required={isRequired}
                    validateStatus={isTouched && error ? 'error' : ''}
                    help={isTouched && error ? (error as React.ReactNode) : undefined}
                >
                    <Input.TextArea
                        {...field}
                        id={name}
                        size={size ?? 'middle'}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        maxLength={maxLength}
                        autoSize={{ minRows, maxRows }}
                        spellCheck={false}
                        className="font-mono text-xs"
                        onChange={e => setFieldValue(name, e.target.value)}
                        showCount={showCount}
                    />
                </Form.Item>
            );
        }}
    </Field>
);

export default CodeTextAreaInput;
