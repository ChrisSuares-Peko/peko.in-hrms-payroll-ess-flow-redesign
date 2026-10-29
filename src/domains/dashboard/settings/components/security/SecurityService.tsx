import { Flex, Switch, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

interface SecurityServiceProps {
    title: string;
    isChecked: boolean;
    handleSubmit: (values: { title: string; checked: boolean }) => void;
}

const { Text } = Typography;

const SecurityService = ({ title, isChecked, handleSubmit }: SecurityServiceProps) => {
    const dispatch = useAppDispatch();
    return (
        <Flex className="w-full " justify="space-between" align="center">
            <Text className="font-normal text-valueText text-custom">{title}</Text>
            <Switch
                value={false}
                // checked={value}
                onChange={e => dispatch(showToast({ description: 'Coming Soon', variant: 'info' }))}
                size="small"
            />
        </Flex>
    );
};

export default SecurityService;
