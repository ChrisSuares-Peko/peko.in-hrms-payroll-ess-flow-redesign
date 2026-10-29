import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

type Props = {
    property: string;
    value: string | null | ReactNode;
};
const ListItem = ({ property, value }: Props) => (
    <Flex justify="start" className="mt-2 gap-4">
        <Typography.Text className="sm:text-nowrap text-gray-500 sm:min-w-40">
            {property}:
        </Typography.Text>
        <Typography.Paragraph className="font">{value || 'N/A'}</Typography.Paragraph>
    </Flex>
);

export default ListItem;
