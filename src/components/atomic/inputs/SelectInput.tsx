import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { SelectProps } from 'antd/es/select';
import { Field, FieldProps, getIn } from 'formik';

import { DropDown } from '@customtypes/general';

interface SelectInputProps {
    name: string;
    label?: React.ReactNode | string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    options: DropDown | any[];
    showToolTip?: boolean;
    tooltipText?: string;
    // See TextInput's identical prop — 'light' (default) keeps every existing usage's
    // white-bubble/dark-text tooltip unchanged; 'dark' renders antd's plain default look.
    tooltipTheme?: 'light' | 'dark';
    handleChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    allowClear?: boolean;
    showSearch?: boolean;
    filterOption?: boolean | ((input: string, option: any) => boolean);
    optionFilterProp?: string;
    formItemClass?: string;
    // Class on the dropdown popup (e.g. to let long option text wrap).
    popupClassName?: string;
    mode?: SelectProps<any>['mode'];
    open?: boolean;
    onDropdownVisibleChange?: (open: boolean) => void;
    loading?: boolean;
}

const SelectInput: React.FC<SelectInputProps> = ({
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
    tooltipTheme = 'light',
    handleChange,
    onSearch,
    allowClear,
    showSearch,
    filterOption,
    optionFilterProp,
    formItemClass,
    popupClassName,
    mode,
    open,
    onDropdownVisibleChange,
    loading,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, values, setFieldValue } }: FieldProps) => {
            const optionValues = options?.map(opt => opt.value);
            const fieldValue = getIn(values, name);
            // tags/multiple values are not in `options` (tags are free-typed), so
            // the includes() check would always blank the field on edit.
            const isMulti = mode === 'tags' || mode === 'multiple';
            let resolvedValue;
            if (isMulti) {
                if (Array.isArray(fieldValue)) {
                    resolvedValue = fieldValue;
                } else if (fieldValue != null && fieldValue !== '') {
                    resolvedValue = [fieldValue];
                } else {
                    resolvedValue = [];
                }
            } else {
                resolvedValue = optionValues?.includes(fieldValue) ? fieldValue : undefined;
            }
            return (
                <Form.Item
                    className={formItemClass}
                    label={label && <span title="">{label}</span>}
                    colon={false}
                    required={isRequired}
                    validateStatus={getIn(touched, name) && getIn(errors, name) ? 'error' : ''}
                    help={
                        getIn(touched, name) && getIn(errors, name)
                            ? (getIn(errors, name) as React.ReactNode)
                            : undefined
                    }
                    {...(showToolTip && {
                        tooltip: {
                            title: tooltipText,
                            placement: 'right',
                            icon: <InfoCircleOutlined />,
                            ...(tooltipTheme === 'light'
                                ? {
                                      color: 'white',
                                      overlayInnerStyle: { color: '#171717' },
                                      overlayStyle: { minWidth: 300 },
                                  }
                                : {}),
                        },
                    })}
                >
                    <Select
                        {...field}
                        id={name}
                        allowClear={allowClear}
                        showSearch={showSearch}
                        placeholder={placeholder}
                        disabled={isDisabled}
                        value={resolvedValue}
                        className={classes}
                        onSearch={onSearch}
                        mode={mode}
                        size={size}
                        filterOption={filterOption}
                        optionFilterProp={optionFilterProp}
                        popupClassName={popupClassName}
                        onChange={e => {
                            setFieldValue(name, e);
                            if (handleChange) handleChange(e);
                        }}
                        open={open}
                        onOpenChange={onDropdownVisibleChange}
                        loading={loading}
                    >
                        {options?.map((option, index) => (
                            <Select.Option key={index} value={option.value}>
                                {option.label}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
            );
        }}
    </Field>
);

export default SelectInput;
