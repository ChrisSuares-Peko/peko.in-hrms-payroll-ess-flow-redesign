import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Switch, Tooltip, Typography } from 'antd';
import { Field, FieldProps, useFormikContext } from 'formik';

interface SwitchInputProps {
    name: string;
    label?: string;
    isDisabled?: boolean;
    classes?: string;
    labelClasses?: string;
    showToolTip?: boolean;
    tooltipText?: string;
}

const SwitchInput: React.FC<SwitchInputProps> = ({
    name,
    label,
    isDisabled,
    classes,
    labelClasses,
    showToolTip = false,
    tooltipText,
}) => {
    const { setFieldValue } = useFormikContext();
    const onChange = (checked: boolean) => {
        setFieldValue(name, checked);
    };

    return (
        <Field name={name}>
            {({ field, form: { values } }: FieldProps) => (
                <Flex className=" w-full mb-2" align="center" justify="space-between">
                    <Flex gap={3}>
                        <Typography.Text className={labelClasses}>{label}</Typography.Text>{' '}
                        {showToolTip && (
                            <Tooltip
                                overlayInnerStyle={{
                                    color: '#171717',
                                }}
                                overlayStyle={{
                                    minWidth: 300,
                                }}
                                color="white"
                                placement="right"
                                title={tooltipText}
                            >
                                <InfoCircleOutlined />
                            </Tooltip>
                        )}
                    </Flex>

                    <Switch
                        defaultValue={field.value !== '' ? field.value : undefined}
                        disabled={isDisabled}
                        className={classes}
                        onChange={onChange}
                        checked={values[name]}
                    />
                </Flex>
            )}
        </Field>
    );
};

export default SwitchInput;
