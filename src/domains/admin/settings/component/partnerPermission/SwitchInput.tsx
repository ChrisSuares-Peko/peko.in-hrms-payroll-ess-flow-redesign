import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Switch, Typography, Tooltip } from 'antd';
import { Field, FieldProps, getIn, useFormikContext } from 'formik';

interface SwitchInputProps {
    name: string;
    label?: string;
    isDisabled?: boolean;
    classes?: string;
    labelClasses?: string;
    onChange?: (checked: boolean) => void;
    showToolTip?: boolean;
    tooltipText?: string;
}

const SwitchInput: React.FC<SwitchInputProps> = ({
    name,
    label,
    isDisabled,
    classes,
    labelClasses,
    onChange,
    showToolTip = false,
    tooltipText,
}) => {
    const { setFieldValue } = useFormikContext();

    const handleChange = (checked: boolean) => {
        if (onChange) {
            onChange(checked);
        } else setFieldValue(name, checked);
    };

    return (
        <Field name={name}>
            {({ form: { values } }: FieldProps) => (
                <Flex className="w-full mb-6 " align="center" justify="space-between">
                    <div className="flex items-center">
                        <Typography.Text className={labelClasses}>{label}</Typography.Text>
                        {showToolTip && (
                            <Tooltip
                                title={tooltipText}
                                color="white"
                                placement="right"
                                overlayInnerStyle={{
                                    color: '#171717',
                                }}
                            >
                                <InfoCircleOutlined style={{ marginLeft: 8 }} />
                            </Tooltip>
                        )}
                    </div>
                    {/*
                      * `getIn`, not `values[name]`: nested paths like
                      * `permissions[0].hasAccess` are not literal keys on `values`, so
                      * a plain lookup yields undefined — which leaves antd's Switch
                      * uncontrolled, rendering from its own internal state and snapping
                      * back whenever the row remounts.
                      */}
                    <Switch
                        disabled={isDisabled}
                        className={classes}
                        onChange={handleChange}
                        checked={!!getIn(values, name)}
                    />
                </Flex>
            )}
        </Field>
    );
};

export default SwitchInput;
