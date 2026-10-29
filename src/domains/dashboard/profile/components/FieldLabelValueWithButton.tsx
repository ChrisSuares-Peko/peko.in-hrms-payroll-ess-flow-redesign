import React from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Typography, theme } from 'antd';

interface FieldLabelWithButtonValueProps {
    label: string;
    value: string;
    id: number;
    handleDelete: (id: number) => void;
    handleEdit: (id: number) => void;
}

const FieldLabelWithButton: React.FC<FieldLabelWithButtonValueProps> = ({
    label,
    value,
    id,
    handleDelete,
    handleEdit,
}) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <Flex className=" w-full pr-3" justify="space-between" align="center">
            <Flex vertical gap={12}>
                <Typography.Text className=" text-titleText font-normal text-sm  ">
                    {label}
                </Typography.Text>
                <Typography.Text className=" text-valueText font-normal text-custom">
                    {value}
                </Typography.Text>
            </Flex>
            <Flex gap={8}>
                {/* <Button danger size="small" className=" rounded-sm" onClick={() => handleEdit(id)}>
                    Edit
                </Button> */}
                <EditOutlined
                    onClick={() => handleEdit(id)}
                    style={{ color: colorPrimary }}
                    className=" text-lg cursor-pointer"
                />

                <DeleteOutlined
                    style={{ color: colorPrimary }}
                    className=" text-lg cursor-pointer"
                    onClick={() => handleDelete(id)}
                />
            </Flex>
        </Flex>
    );
};

export default FieldLabelWithButton;
