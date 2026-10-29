import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Select } from 'antd';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Field, FieldProps, getIn } from 'formik';

import { DropDown } from '@customtypes/general';

interface SelectInputProps {
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
    handleChange?: (value: string) => void;
    mode?: 'multiple' | 'tags' | undefined;
    maxCount?: number;
    disableDeselect?: boolean;
    onSearch?: (value: string) => void;
    onClick?: () => void;
    loading?: boolean;
    optionRender?: (oriOption: any, info: { index: number }) => React.ReactNode;
    notFoundContent?: React.ReactNode;
}

const SelectInputWithSearch: React.FC<SelectInputProps> = ({
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
    maxCount,
    handleChange,
    mode,
    disableDeselect,
    onSearch,
    onClick,
    loading,
    optionRender,
    notFoundContent,
}) => (
    <Field name={name}>
        {({ form: { touched, errors, values, setFieldValue, validateField } }: FieldProps) => (
            <Form.Item
                label={label && <span title="">{label}</span>} // Line modified
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
                    id={name}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    value={getIn(values, name) !== '' ? getIn(values, name) : undefined}
                    className={classes}
                    size={size}
                    maxCount={maxCount}
                    onChange={e => {
                        setFieldValue(name, e);
                        setTimeout(() => validateField(name), 0);
                        if (handleChange) handleChange(e);
                    }}
                    options={options}
                    filterOption={(input: string, option) =>
                        ((option?.label ?? '') as string)
                            .toLowerCase()
                            .startsWith(input.toLowerCase())
                    }
                    showSearch
                    onClick={() => {
                        if (onClick) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                            onClick && onClick();
                        }
                    }}
                    mode={mode}
                    loading={loading}
                    optionRender={optionRender}
                    allowClear={!disableDeselect}
                    notFoundContent={notFoundContent}
                />
            </Form.Item>
        )}
    </Field>
);

export default SelectInputWithSearch;
