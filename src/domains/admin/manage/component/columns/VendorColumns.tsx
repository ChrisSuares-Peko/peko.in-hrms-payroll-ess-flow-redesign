import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { Vendor } from '../../../settings/types/vendors';

interface ColumnsProps {
    handleActive: (connectId: number | string, isActive: any) => void;
    handleEdit: (record: Vendor) => void;
}

const getVendorColumns = ({ handleActive, handleEdit }: ColumnsProps): ColumnsType<Vendor> => [
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
        title: 'Vendor Name',
        dataIndex: 'vendorName',
        sorter: true,
        key: 'vendorName',
    },
    {
        title: 'API URL',
        dataIndex: 'apiUrl',
        sorter: true,
        key: 'apiUrl',
    },
    {
        title: 'Health URL',
        dataIndex: 'healthUrl',
        sorter: true,
        key: 'healthUrl',
    },
    {
        title: 'Type',
        dataIndex: 'type',
        sorter: true,
        key: 'type',
    },
    {
        title: 'Status',
        dataIndex: 'isActive',
        sorter: true,
        key: 'isActive',
        render: (isActive: any, record: Vendor) =>
            isActive === 1 || isActive === true ? (
                <CheckOutlined
                    className="cursor-pointer text-textLime"
                    onClick={() => handleActive(record.id, record.isActive)}
                />
            ) : (
                <CloseOutlined
                    className="cursor-pointer text-brandColor"
                    onClick={() => handleActive(record.id, record.isActive)}
                />
            ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: Vendor) => <EditOutlined onClick={() => handleEdit(record)} />,
    },
];

export default getVendorColumns;
