import React, { ReactNode } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, InputNumber } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, getIn } from 'formik';

import useScreenSize from '@src/hooks/useScreenSize';

interface NumberWithUnitProps {
    name: string;
    label?: string | ReactNode;
    unit: string; // Kg, Cm, etc.
    placeholder?: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    formItemClass?: string;
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    showToolTip?: boolean;
    tooltipText?: string | JSX.Element;
    // callbacks
    onChange?: (value: number | null) => void;
    onBlur?: () => void;
}

const NumberWithUnit: React.FC<NumberWithUnitProps> = ({
    name,
    label,
    unit,
    placeholder,
    size = 'middle',
    isDisabled,
    isRequired,
    classes,
    formItemClass,
    min,
    max,
    step,
    precision,
    showToolTip = false,
    tooltipText,
    onChange,
    onBlur,
}) => {
    const { sm } = useScreenSize();

    return (
        <Field name={name}>
            {({ field, form: { touched, errors, setFieldValue, setFieldTouched } }: FieldProps) => {
                const error = getIn(errors, name);
                const isTouched = getIn(touched, name);

                return (
                    <Form.Item
                        label={
                            label && (
                                <span>
                                    {label}
                                    {isRequired && (
                                        <span style={{ color: '#ff4d4f', marginLeft: 4 }}> *</span>
                                    )}
                                </span>
                            )
                        }
                        colon={false}
                        required={false} // we handle the asterisk manually
                        validateStatus={isTouched && error ? 'error' : ''}
                        help={isTouched && error ? (error as React.ReactNode) : undefined}
                        tooltip={
                            showToolTip
                                ? {
                                    title: tooltipText,
                                    color: 'white',
                                    placement: sm ? 'right' : 'top',
                                    icon: <InfoCircleOutlined />,
                                    overlayInnerStyle: { color: '#171717' },
                                    overlayStyle: { minWidth: 300 },
                                }
                                : undefined
                        }
                        className={formItemClass}
                    >
                        <InputNumber
                            id={name}
                            // Formik value
                            value={field.value}
                            min={min}
                            max={max}
                            step={step}
                            precision={precision}
                            size={size}
                            placeholder={placeholder}
                            disabled={isDisabled}
                            className={classes}
                            addonAfter={unit}
                            style={{ width: '100%' }}
                            onChange={value => {
                                setFieldValue(name, value);
                                if (onChange) onChange(value as number | null);
                            }}
                            onBlur={() => {
                                setFieldTouched(name, true);
                                if (onBlur) onBlur();
                            }}
                        />
                    </Form.Item>
                );
            }}
        </Field>
    );
};

export default NumberWithUnit;
