import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Switch, Typography, Tooltip } from 'antd';
import { Field, FieldProps, useFormikContext } from 'formik';

const { Text } = Typography;

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
        }
        setFieldValue(name, checked);
    };

    return (
        <Field name={name}>
            {({ field }: FieldProps) => (
                <Flex className="w-full mb-6 " align="center" justify="space-between">
                    <div className="flex items-center">
                        <Text className={labelClasses}>{label}</Text>
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
                    <Switch
                        defaultValue={field.value !== '' ? field.value : undefined}
                        disabled={isDisabled}
                        className={classes}
                        onChange={handleChange}
                        checked={field.value}
                    />
                </Flex>
            )}
        </Field>
    );
};

export default SwitchInput;
