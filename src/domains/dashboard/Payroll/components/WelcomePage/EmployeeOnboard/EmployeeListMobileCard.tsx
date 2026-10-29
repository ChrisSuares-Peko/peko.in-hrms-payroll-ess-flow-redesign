import React from 'react';

import { Card, Divider, Typography, Flex, Avatar, Checkbox } from 'antd';

import { EmployeeTableData } from '../../../types/types';
import { formatDate } from '../../../utils/general/formatter';

interface EmployeecardMobileProps extends EmployeeTableData {
    onSelect: (employeeId: string, selected: boolean) => void;
}
function getInitials(name: string): string {
    const words = name.split(' ');
    const initials = words
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 3)
        .toUpperCase();
    return initials;
}

const EmployeeListMobileCard: React.FC<EmployeecardMobileProps> = ({
    name,
    department,
    employeeId,
    designation,
    employeeMail,
    id,
    image,
    joinDate,
    phone,
    status,
    isSelected = false,
    onSelect,
}) => (
    <Card size="small" className="mt-4 h-50 bg-slate-50 border-none p-2">
        <Flex className="w-full" gap={5} vertical>
            <Flex className="w-full" justify="space-between" align="center">
                <Flex align="center" gap={5}>
                    <Checkbox
                        checked={isSelected}
                        onChange={e => onSelect(employeeId, e.target.checked)}
                    />
                    {image ? (
                        <Avatar
                            src={image}
                            style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
                        />
                    ) : (
                        <Avatar style={{ backgroundColor: '#fde3cf', color: 'red' }}>
                            {getInitials(name)}
                        </Avatar>
                    )}
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                        {name}
                    </Typography.Text>
                    <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                        {employeeMail}
                    </Typography.Text>
                </Flex>
            </Flex>
            <Divider />
            <Flex className="w-full" justify="space-between" align="center">
                <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                    Employee ID:
                </Typography.Text>
                <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                    {employeeId}
                </Typography.Text>
            </Flex>
            <Flex className="w-full" justify="space-between" align="center">
                <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                    Designation:
                </Typography.Text>
                <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                    {designation}
                </Typography.Text>
            </Flex>
            <Flex className="w-full" justify="space-between" align="center">
                <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                    Join Date:
                </Typography.Text>
                <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                    {formatDate(joinDate)}
                </Typography.Text>
            </Flex>
            <Flex className="w-full" justify="space-between" align="center">
                <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                    Mobile Number:
                </Typography.Text>
                <Typography.Text className="font-normal text-center text-textDarkGray line-clamp-1">
                    {phone}
                </Typography.Text>
            </Flex>
            <Flex className="w-full" justify="space-between" align="center">
                <Typography.Text className="text-base font-medium text-gray-500 line-clamp-1">
                    Status:
                </Typography.Text>
                <Flex
                    className={`text-sm p-1 px-4 rounded-md font-medium border ${
                        status.toLowerCase() === 'failure'
                            ? 'text-red-400 border-red-400'
                            : 'text-green-400 border-green-400'
                    }`}
                >
                    {status}
                </Flex>
            </Flex>
        </Flex>
    </Card>
);

export default EmployeeListMobileCard;
