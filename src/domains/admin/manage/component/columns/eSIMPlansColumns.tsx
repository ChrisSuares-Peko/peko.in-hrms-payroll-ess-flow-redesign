import {
    CheckOutlined,
    CloseOutlined,
    // DeleteOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import BeforeCommissionNote from '@components/atomic/BeforeCommissionNote';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { EsimPlan } from '../../types/eSIM';

interface ColumnsProps {
    handleActive: (planId: number | undefined, isActive: any) => void;
    handleEdit: (record: EsimPlan) => void;
    handleConfirmation: (record: EsimPlan) => void;
    accessPermission: any;
}

const formatDataPack = (dataMBs: any): string => {
    const mb = Number(dataMBs);
    if (mb === 0) return 'Unlimited';
    const gb = mb / 1024;
    return gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(2)} GB`;
};

const getEsimPlanColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<EsimPlan> => [
    {
        title: 'Date',
        sorter: true,
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Name',
        sorter: true,
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Data Pack',
        sorter: true,
        dataIndex: 'dataMBs',
        key: 'dataMBs',
        render: (dataMBs: any) => <Typography.Text> {formatDataPack(dataMBs)} </Typography.Text>,
    },
    {
        title: 'Validity',
        sorter: true,
        dataIndex: 'periodDays',
        key: 'periodDays',
        render: (periodDays: any) => <Typography.Text>{periodDays} days</Typography.Text>,
        // width: '40%',
    },
    {
        title: 'Amount',
        sorter: true,
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: any, record: EsimPlan) => (
            <Flex vertical>
                <Typography.Text>{`₹ ${formatNumberWithLocalString(amount)}`}</Typography.Text>
                <BeforeCommissionNote amount={amount} totalCommission={record.totalCommission} />
            </Flex>
        ),
    },
    {
        title: 'Country',
        sorter: true,
        dataIndex: 'country',
        key: 'country',
    },

    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: EsimPlan) => (
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
        key: 'view',
        render: (_: any, record: EsimPlan) => {
            const isEditDisabled = !accessPermission?.update;
            const tooltipTitle = isEditDisabled
                ? 'Sorry, you do not have permission to perform this action'
                : '';

            return (
                <Flex justify="start">
                    <Tooltip placement="top" title={tooltipTitle}>
                        <span>
                            {isEditDisabled ? (
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
            );
        },
    },
    // {
    //     title: 'Delete',
    //     dataIndex: 'action',
    //     key: 'delete',
    //     render: (_: any, record: EsimPlan) => (
    //         <DeleteOutlined onClick={() => handleConfirmation(record)} />
    //     ),
    // },
];

export default getEsimPlanColumns;
