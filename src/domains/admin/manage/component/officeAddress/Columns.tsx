import {
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Link } from 'react-router-dom';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PlanBody } from '../../types/plans';

interface ColumnsProps {
    handleActive: (connectId: number | string, isActive: any) => void;
    handleEdit: (record: PlanBody) => void;
    handleConfirmation: (record: PlanBody) => void;
    accessPermission: any;
}

const getPlanColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<PlanBody> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text className="text-nowrap">
                    {formattedDateOnly(new Date(createdAt))}
                </Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Plan Name',
        sorter: true,
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Plan Price',
        sorter: true,
        dataIndex: 'price',
        key: 'price',
        render: (data: any, record: PlanBody) => (
            <Flex vertical>
                <Typography.Text>{`₹ ${formatNumberWithLocalString(data)}`}</Typography.Text>
                <BeforeCommissionNote amount={data} totalCommission={record.totalCommission} />
            </Flex>
        ),
    },
    {
        title: 'Description',
        sorter: true,
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'Highlights',
        sorter: true,
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
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: PlanBody) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {isActive === 1 || isActive === true ? (
                        <CheckOutlined
                            className={`cursor-pointer ${
                                accessPermission?.update ? 'text-textLime' : 'text-gray-400'
                            }`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() =>
                                accessPermission?.update && handleActive(record.id, record.status)
                            }
                            disabled={!accessPermission?.update}
                        />
                    ) : (
                        <CloseOutlined
                            className={`cursor-pointer ${
                                accessPermission?.update ? 'text-brandColor' : 'text-gray-400'
                            }`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() =>
                                accessPermission?.update && handleActive(record.id, record.status)
                            }
                            disabled={!accessPermission?.update}
                        />
                    )}
                </span>
            </Tooltip>
        ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: PlanBody) => (
            <Flex justify="start">
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {!accessPermission?.update ? (
                            <EditOutlined
                                style={{ color: 'gray', cursor: 'not-allowed' }}
                                disabled
                            />
                        ) : (
                            <EditOutlined onClick={() => handleEdit(record)} />
                        )}
                    </span>
                </Tooltip>
            </Flex>
        ),
    },
    {
        title: 'Delete',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: PlanBody) => (
            <Flex justify="start">
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {!accessPermission?.update ? (
                            <DeleteOutlined
                                style={{ color: 'gray', cursor: 'not-allowed' }}
                                disabled
                            />
                        ) : (
                            <DeleteOutlined onClick={() => handleConfirmation(record)} />
                        )}
                    </span>
                </Tooltip>
            </Flex>
        ),
    },
];

export default getPlanColumns;
