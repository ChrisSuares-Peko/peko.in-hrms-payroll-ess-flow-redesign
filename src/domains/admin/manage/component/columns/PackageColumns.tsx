import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import PriceAfterDiscount from '@components/atomic/PriceAfterDiscount';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { Packages } from '../../../settings/types/package';

interface ColumnsProps {
    handleActive: (packageId: number | string, isActive: any) => void;
    handleEdit: (record: Packages) => void;
    handleConfirmation: (record: Packages) => void;
}

const getPackageColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
}: ColumnsProps): ColumnsType<Packages> => [
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
        title: 'Package Name',
        sorter: true,
        dataIndex: 'packageName',
        key: 'packageName',
    },
    {
        title: 'Partner Name',
        sorter: true,
        dataIndex: 'partnerName',
        key: 'partnerName',
        render: partnerName => partnerName || 'N/A',
    },
    {
        title: 'Monthly Price',
        dataIndex: ['packagePrices', 'monthly'],
        key: 'packagePrices.monthly',
        render: (_: any, data: any) => (
            <PriceAfterDiscount
                price={data?.packagePrices?.monthly}
                discount={data?.discount?.monthly}
            />
        ),
    },
    {
        title: 'Annual Price',
        dataIndex: ['packagePrices', 'annually'],
        key: 'packagePrices.annually',
        render: (_: any, data: any) => (
            <PriceAfterDiscount
                price={data?.packagePrices?.annually}
                discount={data?.discount?.annually}
            />
        ),
    },
    // {
    //     title: 'Description',
    //     sorter: true,
    //     dataIndex: 'description',
    //     key: 'description',
    // },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: Packages) =>
            isActive === 1 || isActive === true ? (
                <CheckOutlined
                    className="cursor-pointer text-textLime"
                    onClick={() => handleActive(record.id, record.status)}
                />
            ) : (
                <CloseOutlined
                    className="cursor-pointer text-brandColor"
                    onClick={() => handleActive(record.id, record.status)}
                />
            ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: Packages) => <EditOutlined onClick={() => handleEdit(record)} />,
    },
    {
        title: 'Delete',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: Packages) => (
            <DeleteOutlined onClick={() => handleConfirmation(record)} />
        ),
    },
];

export default getPackageColumns;
