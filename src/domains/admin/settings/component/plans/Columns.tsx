import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Link } from 'react-router-dom';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PlanBody } from '../../types/plans';

interface ColumnsProps {
    handleActive: (connectId: number | string, isActive: any) => void;
    handleEdit: (record: PlanBody) => void;
    handleConfirmation: (record: PlanBody) => void;
}

const getPlanColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
}: ColumnsProps): ColumnsType<PlanBody> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (data: any) => formattedDateTime(new Date(data)),
    },
    {
        title: 'Plan Name',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Plan Price',
        dataIndex: 'price',
        key: 'price',
        render: (data: any, record: PlanBody) => (
            <Flex vertical>
                <Typography.Text>₹ {formatNumberWithLocalString(Number(data))}</Typography.Text>
                <BeforeCommissionNote amount={data} totalCommission={record.totalCommission} />
            </Flex>
        ),
        width: '10%',
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'Highlights',
        dataIndex: 'highlights',
        key: 'highlights',
    },
    {
        title: 'Logo',
        dataIndex: 'logo',
        key: 'logo',
        render: (logo: any) => {
            if (!logo) return 'N/A';
            return (
                <Link to={logo} target="_blank" rel="noopener noreferrer">
                    <EyeOutlined />
                </Link>
            );
        },
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: PlanBody) =>
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
        render: (_: any, record: PlanBody) => <EditOutlined onClick={() => handleEdit(record)} />,
    },
    {
        title: 'Delete',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: PlanBody) => (
            <DeleteOutlined onClick={() => handleConfirmation(record)} />
        ),
    },
];

export default getPlanColumns;
