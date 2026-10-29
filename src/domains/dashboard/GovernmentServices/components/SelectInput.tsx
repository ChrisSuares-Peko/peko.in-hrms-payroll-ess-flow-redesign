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
    handleChange?: (value: string) => void;
    onSearch?: (value: string) => void;
    allowClear?: boolean;
    showSearch?: boolean;
    filterOption?: boolean | ((input: string, option: any) => boolean);
    formItemClass?: string;
    mode?: SelectProps<any>['mode'];
    open?: boolean;
    onDropdownVisibleChange?: (open: boolean) => void;
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
    handleChange,
    onSearch,
    allowClear,
    showSearch,
    filterOption,
    formItemClass,
    mode,
    open,
    onDropdownVisibleChange,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, values, setFieldValue } }: FieldProps) => {
            const optionValues = options?.map(opt => opt.value);
            const fieldValue = getIn(values, name);
            let resolvedValue: string | string[] | undefined;
            if (Array.isArray(fieldValue)) {
                resolvedValue = (fieldValue as string[]).filter(v => optionValues?.includes(v));
            } else {
                resolvedValue = optionValues?.includes(fieldValue) ? fieldValue : undefined;
            }
            return (
                <Form.Item
                    className={formItemClass}
                    label={label && <span title="">{label}</span>}
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
                        onChange={e => {
                            setFieldValue(name, e);
                            if (handleChange && typeof e === 'string') handleChange(e);
                        }}
                        open={open}
                        onOpenChange={onDropdownVisibleChange}
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
