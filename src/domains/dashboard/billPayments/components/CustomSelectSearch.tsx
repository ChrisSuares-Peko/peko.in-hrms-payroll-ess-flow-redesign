import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps } from 'formik';

type DropDown = {
    label: string;
    value: string;
}[];

interface SelectInputProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isLoading?: boolean;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    options: DropDown | any[];
    showToolTip?: boolean;
    tooltipText?: string;
    handleChange?: (value: string, labelName: string) => void;
    open?: boolean;
    onDropdownVisibleChange?: (open: boolean) => void;
    allowClear?: boolean;
    onSearch?: (value: string) => void;
    filterOption?: boolean;
    onPopupScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

const SearchSelectInput: React.FC<SelectInputProps> = ({
    name,
    label,
    placeholder,
    size = 'middle',
    isDisabled,
    isRequired,
    classes,
    options,
    showToolTip = false,
    tooltipText,
    handleChange,
    isLoading,
    open,
    onDropdownVisibleChange,
    allowClear,
    onSearch,
    filterOption = true,
    onPopupScroll,
}) => (
    <Field name={name}>
        {({ form: { touched, errors, values, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={label}
                required={isRequired}
                validateStatus={touched[name] && errors[name] ? 'error' : ''}
                data-testid="form-item"
                help={touched[name] && errors[name] ? (errors[name] as React.ReactNode) : undefined}
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
                    allowClear={allowClear}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    className={classes}
                    value={values[name] !== '' ? values[name] : undefined}
                    size={size}
                    showSearch
                    optionFilterProp="label"
                    filterOption={filterOption}
                    onChange={(value, labelName) => {
                        setFieldValue(name, value);
                        if (handleChange) handleChange(value, labelName);
                    }}
                    loading={isLoading}
                    options={options}
                    open={open}
                    onOpenChange={onDropdownVisibleChange}
                    onSearch={onSearch}
                    onPopupScroll={onPopupScroll}
                />
            </Form.Item>
        )}
    </Field>
);

export default SearchSelectInput;
