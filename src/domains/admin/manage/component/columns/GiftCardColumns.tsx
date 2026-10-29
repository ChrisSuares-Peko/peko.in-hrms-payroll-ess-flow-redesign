import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { GiftCardsBody } from '../../types/giftCards';

interface ColumnsProps {
    handleActive: (connectId: number | string, isActive: any) => void;
    handleEdit: (record: GiftCardsBody) => void;
    accessPermission: any;
    vendorData?: { oName: string; oValue: string | number }[];
}

const getGiftCardsColumns = ({
    handleActive,
    handleEdit,
    accessPermission,
    vendorData = [],
}: ColumnsProps): ColumnsType<GiftCardsBody> => [
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
        title: 'Name',
        sorter: true,
        dataIndex: 'product_name',
        key: 'product_name',
    },
    {
        title: 'Price Type',
        sorter: true,
        dataIndex: 'priceType',
        key: 'priceType',
        render: (priceType: any) => (
            <Flex vertical>
                <Typography.Text>{priceType}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Denominations',
        dataIndex: 'denominations',
        key: 'denominations',
        render: (_: any, record: GiftCardsBody) => {
            if (record.priceType !== 'FLEXI' && record.denominations && record.denominations.length > 0) {
                return <Typography.Text>{record.denominations.join(', ')}</Typography.Text>;
            }
            return <Typography.Text>-</Typography.Text>;
        },
    },
    {
        title: 'Price Range',
        key: 'priceRange',
        render: (_: any, record: GiftCardsBody) => (
            <Typography.Text>{`Min: ₹ ${record.min_price} - Max: ₹ ${record.max_price}`}</Typography.Text>
        ),
    },
    {
        title: 'Sold Quantity',
        sorter: true,
        dataIndex: 'sold_quantity',
        key: 'sold_quantity',
    },
    {
        title: 'Vendor',
        dataIndex: 'serviceOperatorId',
        key: 'serviceOperatorId',
        render: (serviceOperatorId: number | null) => {
            const vendor = vendorData.find(v => String(v.oValue) === String(serviceOperatorId));
            return (
                <Typography.Text>{`Gift Cards (${vendor?.oName ?? serviceOperatorId ?? '-'})`}</Typography.Text>
            );
        },
    },
    // {
    //     title: 'Expiry',
    //     sorter: true,
    //     dataIndex: 'expiry',
    //     key: 'expiry',
    //     render: (_: any, record: GiftCardsBody) => (
    //         <Typography.Text>{new Date(record.expiry).toLocaleDateString()}</Typography.Text>
    //     ),
    // },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (isActive: any, record: GiftCardsBody) => (
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
        render: (_: any, record: GiftCardsBody) => (
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
                        <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} disabled />
                    ) : (
                        <EditOutlined onClick={() => handleEdit(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
];

export default getGiftCardsColumns;
