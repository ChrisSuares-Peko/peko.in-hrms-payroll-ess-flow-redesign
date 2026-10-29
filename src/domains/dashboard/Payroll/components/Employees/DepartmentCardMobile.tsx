import React from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Card, Typography, Flex, Button } from 'antd';

import { departmentTableData } from '../../types/departmentTypes/departmentTypes';

interface DepartmentcardMobileProps extends departmentTableData {
    handleEdit: (data: departmentTableData) => void;
    onDeleteClick: (id: string | number) => void; // rename for clarity
}

const DepartmentcardMobile: React.FC<DepartmentcardMobileProps> = ({
    name,
    code,
    description,
    key,
    date,
    id,
    handleEdit,
    onDeleteClick
}) => (
        <Card
            size="small"
            className="mt-4 h-50 bg-slate-50 border-none p-2"
            // onMouseEnter={() => setIsHovered(true)}
            // onMouseLeave={() => setIsHovered(false)}
        >
            <Flex className="w-full" gap={5} vertical>
                <Flex className="w-full" justify="space-between" align="center">
                    <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                        Department
                    </Typography.Text>
                    <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                        {name}
                    </Typography.Text>
                </Flex>
                <Flex className="w-full" justify="space-between" align="center">
                    <Typography.Text className="text-base font-medium  text-gray-500 line-clamp-1">
                        ID
                    </Typography.Text>
                    <Typography.Text className="font-normal text-center text-gray-500 line-clamp-1">
                        {code || 'N/A'}
                    </Typography.Text>
                </Flex>

             

                <Flex className="w-full" justify="space-between" align="center">
                    <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                        Date Added:
                    </Typography.Text>
                    <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                        {date}
                    </Typography.Text>
                </Flex>
                <Flex justify="center" className="mt-4" gap={15}>
                    <Button
                        className="border-none text-textRed"
                        type="default"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit({ name, code, description, key, date, id })}
                    />

                    <Button
                        className="border-none"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onDeleteClick(id!)}
                    />
                </Flex>
            </Flex>
        </Card>
    );

export default DepartmentcardMobile;
