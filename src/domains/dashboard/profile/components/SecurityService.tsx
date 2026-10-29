import { useState } from 'react';

import { Flex, Switch, Typography } from 'antd';

interface SecurityServiceProps {
    title: string;
    isChecked: boolean;
    handleSubmit: (values: { title: string; checked: boolean }) => void;
}

const SecurityService = ({ title, isChecked, handleSubmit }: SecurityServiceProps) => {
    const [value, setValue] = useState(isChecked);
    const onChange = (checked: boolean) => {
        setValue(checked);
        handleSubmit({ title, checked });
    };

    return (
        <Flex className=" w-full" justify="space-between" align="center">
            <Typography.Text className=" text-valueText font-normal text-custom">
                {title}
            </Typography.Text>
            <Switch checked={value} onChange={onChange} size="small" />
        </Flex>
    );
};

export default SecurityService;
