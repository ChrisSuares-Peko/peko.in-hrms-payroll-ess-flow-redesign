import { EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import ChallanStatusBadge from './ChallanStatusBadge';
import { ChallanRow } from '../types/index';

const { Text } = Typography;

interface Props {
    data: ChallanRow[];
    isLoading: boolean;
    selectedRowKeys?: React.Key[];
    onSelectChange?: (keys: React.Key[]) => void;
    onView: (record: ChallanRow) => void;
    onPay: (record: ChallanRow) => void;
    // Turbo (fleet) shows the vehicle column; Bill Payments (single vehicle) hides it.
    showVehicleColumn?: boolean;
    // Row checkboxes for bulk "Pay Selected" (off for the single-vehicle Bill flow).
    selectable?: boolean;
    emptyText?: string;
}

const ChallanTable = ({
    data,
    isLoading,
    selectedRowKeys,
    onSelectChange,
    onView,
    onPay,
    showVehicleColumn = true,
    selectable = true,
    emptyText = 'No challans found',
}: Props) => {
    const columns: ColumnsType<ChallanRow> = [
        ...(showVehicleColumn
            ? [
                  {
                      title: 'Vehicle Number',
                      dataIndex: 'registration_number',
                      key: 'registration_number',
                      width: 150,
                      render: (value: string) => (
                          <Text className="text-[#42526D]">{value}</Text>
                      ),
                  },
              ]
            : []),
        {
            title: 'Challan No.',
            dataIndex: 'challan_number',
            key: 'challan_number',
            width: 170,
            render: (value: string) => <Text className="text-[#42526D]">{value}</Text>,
        },
        {
            title: 'Offense',
            dataIndex: 'offense_details',
            key: 'offense_details',
            render: (value: string, record) => (
                <Flex vertical>
                    <Text className="text-[#42526D]">{value}</Text>
                    {record.challan_place && (
                        <Text className="text-xs text-[#42526D] opacity-70">
                            {record.challan_place}
                        </Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (value: number) => (
                <Text className="whitespace-nowrap text-[#42526D]">
                    ₹ {formatNumberWithLocalString(value)}
                </Text>
            ),
        },
        {
            title: 'Challan Date',
            dataIndex: 'challan_date',
            key: 'challan_date',
            width: 130,
            render: (value: string) => {
                const [date, time] = (value || '').split(' ');
                return (
                    <Flex vertical>
                        <Text className="whitespace-nowrap text-[#42526D]">{date}</Text>
                        {time && (
                            <Text className="whitespace-nowrap text-xs text-[#42526D] opacity-70">
                                {time}
                            </Text>
                        )}
                    </Flex>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'challan_status',
            key: 'challan_status',
            width: 130,
            render: (_, record) => <ChallanStatusBadge status={record.challan_status} />,
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Flex gap={12} align="center">
                    <EyeOutlined
                        className="cursor-pointer text-lg text-[#FF4F4F]"
                        onClick={() => onView(record)}
                    />
                    {record.isPayable && (
                        <Button
                            size="small"
                            className="border-[#FF4F4F] px-6 text-xs text-[#FF4F4F]"
                            onClick={() => onPay(record)}
                        >
                            Pay
                        </Button>
                    )}
                </Flex>
            ),
        },
    ];

    // Select-all and per-row checkboxes cover only payable (non-Paid) challans.
    const rowSelection = selectable
        ? {
              selectedRowKeys,
              onChange: onSelectChange,
              getCheckboxProps: (record: ChallanRow) => ({ disabled: !record.isPayable }),
          }
        : undefined;

    return (
        <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data}
            loading={isLoading}
            locale={{ emptyText }}
            pagination={false}
            scroll={{ x: 900 }}
            className="challan-table mt-5 w-full"
        />
    );
};

export default ChallanTable;
