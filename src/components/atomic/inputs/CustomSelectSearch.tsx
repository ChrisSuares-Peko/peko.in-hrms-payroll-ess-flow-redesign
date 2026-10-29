import React, { useEffect } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, useFormikContext } from 'formik';

interface Option {
    oName: string;
    oValue: any; // string if any error occurs
}

interface CustomSelectSearchProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    loading?: boolean;
    showSearch?: boolean;
    options: Option[];
    showToolTip?: boolean;
    tooltipText?: string;
    onChange?: (value: string, name: string) => void;
    onSearch?: (value: string) => void;
    onClear?: (setField: any) => void;
    defaultValue?: string;
    filterOption?: boolean;
    allowClear?: boolean;
}

const CustomSelectSearch: React.FC<CustomSelectSearchProps> = ({
    name,
    label,
    placeholder,
    size = 'middle',
    isDisabled,
    isRequired,
    classes,
    options,
    showToolTip = false,
    loading = false,
    showSearch = true,
    tooltipText,
    onChange,
    onSearch, // Receive onSearch prop
    defaultValue,
    filterOption,
    onClear,
    allowClear = true,
}) => {
    const formikContext = useFormikContext();

    useEffect(() => {
        const { setFieldValue, values } = formikContext as {
            setFieldValue: (name: string, value: any) => void;
            values: Record<string, any>;
        };
        if (options.length === 1 && options[0].oValue !== values[name]) {
            setFieldValue(name, options[0].oValue);
        }
    }, [options, name, formikContext]);
    return (
        <Field name={name}>
            {({ form: { touched, errors, values, setFieldValue } }: FieldProps) => (
                <Form.Item
                    label={label}
                    required={isRequired}
                    data-testid="form-item"
                    validateStatus={touched[name] && errors[name] ? 'error' : ''}
                    help={
                        touched[name] && errors[name]
                            ? (errors[name] as React.ReactNode)
                            : undefined
                    }
                    {...(showToolTip && {
                        tooltip: {
                            title: tooltipText,
                            color: 'white',
                            placement: 'right',
                            icon: <InfoCircleOutlined />,
                            overlayInnerStyle: {
                                color: '#171717',
                            },
                            overlayStyle: {
                                minWidth: 300,
                            },
                        },
                    })}
                >
                    <Select
                        filterOption={filterOption}
                        optionFilterProp="children"
                        showSearch={showSearch}
                        loading={loading}
                        onChange={(value: string) => {
                            setFieldValue(name, value);
                            if (onChange) {
                                const selectedOption = options.find(
                                    option => option.oValue === value
                                );
                                if (selectedOption) {
                                    onChange(selectedOption.oValue, selectedOption.oName);
                                }
                            }
                        }}
                        onSearch={onSearch} // Pass onSearch prop to Select component
                        autoClearSearchValue
                        value={values[name] || undefined}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        className={classes}
                        size={size}
                        defaultValue={defaultValue}
                        allowClear={allowClear}
                        onClear={() => {
                            setFieldValue(name, '');
                            if (onClear) onClear(setFieldValue);
                        }}
                        onSelect={(value: string) => {
                            setFieldValue(name, value);
                            if (onChange) {
                                const selectedOption = options?.find(
                                    option => option.oValue === value
                                );
                                if (selectedOption) {
                                    onChange(selectedOption.oValue, selectedOption.oName);
                                }
                            }
                        }}
                    >
                        {options.map(({ oName, oValue }, index) => (
                            <Select.Option key={index} value={oValue}>
                                {oName}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            )}
        </Field>
    );
};

export default CustomSelectSearch;
