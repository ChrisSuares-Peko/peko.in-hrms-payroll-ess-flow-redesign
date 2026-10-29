import { useCallback, useState } from 'react';

import { Flex, Form, Select, Typography } from 'antd';
import { ErrorMessage, useFormikContext } from 'formik';

import { DropDown } from '@customtypes/general';

type Props = {
    name?: string;
    options: DropDown | any[];
    label: string;
    showSearch?: boolean;
    showLabelAfterSelect?: boolean;
    handleChange?: (option: any) => void;
};
const { Text } = Typography;

const CustomDropDown = ({
    options,
    label,
    name,
    showSearch,
    showLabelAfterSelect,
    handleChange,
}: Props) => {
    const [value, setValue] = useState();

    const handleUpdate = useCallback(
        (_: any, option: any) => {
            setValue(option);
            if (handleChange) {
                handleChange(option);
            }
        },
        [handleChange]
    );

    const { values }: any = useFormikContext();
    return (
        <Form.Item className="mb-0">
            <Flex align="center" className="px-3 py-2 border border-gray-200 rounded-xl">
                {showLabelAfterSelect && value && (
                    <Text className="text-gray-500 text-nowrap">{label}</Text>
                )}
                <Select
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder={label}
                    allowClear
                    options={options}
                    className={`${showLabelAfterSelect && value ? 'text-end' : 'text-start'} h-5`}
                    variant="borderless"
                    showSearch={showSearch}
                    onChange={handleUpdate}
                    value={name && values?.[name] ? values[name] : undefined}
                />
            </Flex>
            {name && (
                <ErrorMessage
                    name={name}
                    component="div"
                    className="w-full text-red-500 error-message"
                />
            )}
        </Form.Item>
    );
};

export default CustomDropDown;
