import React from 'react';

import { Checkbox as AntCheckbox, Flex, Form } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { Field, FieldProps, getIn } from 'formik';

interface CheckboxProps {
    name: string;
    children?: React.ReactNode;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (e: CheckboxChangeEvent) => void;
    classes?: string;
    isRequired?: boolean;
}

const CheckboxInput: React.FC<CheckboxProps> = ({
    name,
    children,
    checked,
    disabled,
    onChange,
    classes,
    isRequired,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors } }: FieldProps) => (
            <Form.Item
                validateStatus={getIn(touched, name) && getIn(errors, name) ? 'error' : ''}
                help={getIn(touched, name) && getIn(errors, name) ? (getIn(errors, name) as React.ReactNode) : undefined}
                required={isRequired}
                style={{ marginBottom: 0 }}
                className="w-full"
            >
                <Flex align="flex-start" className="w-full">
                    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                        <AntCheckbox
                            {...field}
                            id={`${name}-checkbox`}
                            checked={checked ?? field.value}
                            disabled={disabled}
                            required={isRequired}
                            onChange={e => {
                                field.onChange(e);
                                if (onChange) {
                                    onChange(e);
                                }
                            }}
                            className={classes}
                        />
                        {/* flex: 1 claims the rest of the row's width instead of shrinking to
                        its own content's natural width — minWidth: 0 is needed alongside it
                        because a flex item's default min-width is `auto` (its content's
                        intrinsic width), which otherwise stops it from wrapping text at all and
                        just overflows/pushes the row wider instead. Without both, long wrapped
                        text (e.g. the eSign terms-of-use checkbox) wraps far short of the
                        container's actual right edge, leaving dead space beside it. */}
                        {/* textAlign: justify only affects lines that actually wrap — a
                        single-line label (every other current usage of this component) is
                        untouched, and a wrapped paragraph's own LAST line is never justified
                        either, so this only changes the eSign terms-of-use-style multi-line
                        case it was added for. */}
                        <label
                            htmlFor={`${name}-checkbox`}
                            style={{ marginLeft: 8, flex: 1, minWidth: 0, textAlign: 'justify' }}
                            className="cursor-pointer"
                        >
                            {children}
                        </label>
                    </div>
                </Flex>
            </Form.Item>
        )}
    </Field>
);

export default CheckboxInput;
