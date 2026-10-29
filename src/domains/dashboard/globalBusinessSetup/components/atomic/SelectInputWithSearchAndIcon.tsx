import React, { useMemo } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Image, Select } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, getIn } from 'formik';

import { DropDown } from '@customtypes/general';

interface SelectInputWithSearchAndIconProps {
    name: string;
    label?: string;
    placeholder: string;
    size?: SizeType;
    isDisabled?: boolean;
    isRequired?: boolean;
    classes?: string;
    options: DropDown | any[];
    showToolTip?: boolean;
    tooltipText?: string;

    handleChange?: (value: any) => void;
    handleSearch?: (value: string) => void;
    onClear?: () => void;

    mode?: 'multiple' | 'tags' | undefined;
    disableDeselect?: boolean;
    maxCount?: number;

    loading?: boolean;
    maxTagCount?: number | 'responsive';
    maxTagPlaceholder?: (omittedValues: any[]) => React.ReactNode;

    notFoundContent?: string;
}

const SelectInputWithSearchAndIcon: React.FC<SelectInputWithSearchAndIconProps> = ({
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
    handleSearch,
    onClear,

    mode,
    disableDeselect,
    maxCount,

    loading = false,
    maxTagCount,
    maxTagPlaceholder,

    notFoundContent,
}) => {
    const memoizedOptions = useMemo(() => {
        if (!Array.isArray(options)) return [];
        return Array.from(new Map(options.map(opt => [opt.value, opt])).values());
    }, [options]);

    return (
        <Field name={name}>
            {({
                field,
                form: { touched, errors, values, setFieldValue, setFieldTouched },
            }: FieldProps) => {
                const error = getIn(errors, name);
                const isTouched = getIn(touched, name);
                const value = getIn(values, name);
                const normalizedValue = (() => {
                    if (mode === 'multiple' || mode === 'tags') {
                        if (Array.isArray(value)) {
                            return value;
                        }
                        if (value === undefined || value === null || value === '') {
                            return [];
                        }
                        return [value];
                    }
                    return value || undefined;
                })();

                return (
                    <Form.Item
                        label={label && <span>{label}</span>}
                        required={isRequired}
                        validateStatus={isTouched && error ? 'error' : ''}
                        help={isTouched && error ? (error as React.ReactNode) : undefined}
                        tooltip={
                            showToolTip && {
                                title: tooltipText,
                                color: 'white',
                                placement: 'right',
                                icon: <InfoCircleOutlined />,
                                overlayInnerStyle: { color: '#171717' },
                                overlayStyle: { minWidth: 300 },
                            }
                        }
                    >
                        <Select
                            loading={loading}
                            placeholder={placeholder}
                            disabled={isDisabled || loading}
                            value={loading ? undefined : normalizedValue}
                            className={classes}
                            size={size}
                            mode={mode}
                            allowClear={!disableDeselect}
                            maxCount={maxCount}
                            showSearch
                            notFoundContent={notFoundContent}
                            onSearch={e => handleSearch?.(e)}
                            onClear={() => {
                                if (mode === 'multiple' || mode === 'tags') {
                                    setFieldValue(name, []);
                                } else {
                                    setFieldValue(name, '');
                                }
                                setFieldTouched(name, true);
                                onClear?.();
                            }}
                            onBlur={() => {
                                field.onBlur({ target: { name } });
                            }}
                            filterOption={(input, option) => {
                                const searchText = String(
                                    (option as any)?.searchField || (option as any)?.label || ''
                                );
                                return searchText.toLowerCase().includes(input.toLowerCase());
                            }}
                            maxTagCount={maxTagCount}
                            maxTagPlaceholder={
                                maxTagPlaceholder ||
                                (mode === 'multiple' && maxTagCount
                                    ? omitted => `+${omitted.length} more`
                                    : undefined)
                            }
                            onChange={val => {
                                const finalValue = (() => {
                                    if (mode === 'multiple' || mode === 'tags') {
                                        if (val === null || val === undefined) {
                                            return [];
                                        }
                                        return Array.isArray(val) ? val : [];
                                    }
                                    return val || '';
                                })();
                                setFieldValue(name, finalValue, true);
                                setFieldTouched(name, true, false);
                                handleChange?.(val);
                            }}
                        >
                            {memoizedOptions.map((option, index) => (
                                <Select.Option
                                    key={option.value ?? index}
                                    value={option.value}
                                    label={option.label}
                                    searchField={option.searchField || option.label}
                                >
                                    <Flex align="center" gap={8}>
                                        {option.icon && (
                                            <Image
                                                src={option.icon}
                                                width={28}
                                                height={20}
                                                preview={false}
                                            />
                                        )}
                                        {option.label}
                                    </Flex>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                );
            }}
        </Field>
    );
};

export default SelectInputWithSearchAndIcon;
