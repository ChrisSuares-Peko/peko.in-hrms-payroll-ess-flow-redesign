import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { serviceOperator } from '../../types/serviceOperator';

interface ColumnsProps {
    handleActive: (operatorId: number | string, isActive: any) => void;
    handleEdit: (record: serviceOperator) => void;
}

const getOperatorColumns = ({
    handleActive,
    handleEdit,
}: ColumnsProps): ColumnsType<serviceOperator> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Operator Name',
        dataIndex: 'serviceProvider',
        sorter: true,
        key: 'serviceProvider',
    },
    {
        title: 'Access Key',
        dataIndex: 'accessKey',
        sorter: true,
        key: 'accessKey',
    },
    {
        title: 'Service Category',
        dataIndex: 'serviceCategory',
        sorter: true,
        key: 'serviceCategory',
    },
    {
        title: 'Commission Type',
        dataIndex: 'commissionType',
        sorter: true,
        key: 'commissionType',
    },
    {
        title: 'Commission',
        dataIndex: 'providerCommission',
        sorter: true,
        key: 'providerCommission',
    },
    {
        title: 'Vendor Name',
        dataIndex: 'vendorName',
        sorter: true,
        key: 'vendorName',
    },
    {
        title: 'Status',
        dataIndex: 'serviceStatus',
        sorter: true,
        key: 'serviceStatus',
        render: (isActive: any, record: serviceOperator) =>
            isActive === 1 || isActive === true ? (
                <CheckOutlined
                    className="cursor-pointer text-textLime"
                    onClick={() => {
                        if (record.id !== undefined) {
                            handleActive(record.id, record.serviceStatus); // Ensure `record.id` is defined
                        }
                    }}
                />
            ) : (
                <CloseOutlined
                    className="cursor-pointer text-brandColor"
                    onClick={() => {
                        if (record.id !== undefined) {
                            handleActive(record.id, record.serviceStatus); // Ensure `record.id` is defined
                        }
                    }}
                />
            ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: serviceOperator) => (
            <EditOutlined onClick={() => handleEdit(record)} />
        ),
    },
];

export default getOperatorColumns;
