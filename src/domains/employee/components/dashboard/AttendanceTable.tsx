import { Flex, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import WatchIcon from '../../assets/icons/watch.svg';
import { DashboardAttendanceRow, DashboardAttendanceStatus } from '../../types';

const statusStyle: Record<DashboardAttendanceStatus, { bg: string; color: string }> = {
    Present: { bg: '#ECFDF3', color: '#027A48' },
    Late: { bg: '#FFF8E2', color: '#E0A800' },
    Absent: { bg: '#FFECEC', color: '#D92D20' },
    Leave: { bg: '#EFF8FF', color: '#175CD3' },
};

const StatusBadge = ({ status }: { status: DashboardAttendanceStatus }) => {
    const style = statusStyle[status];
    return (
        <Flex
            align="center"
            justify="center"
            gap={7}
            className="inline-flex px-3 py-[3px] rounded-full"
            style={{ backgroundColor: style.bg }}
        >
            <span className="rounded-full size-[7px]" style={{ backgroundColor: style.color }} />
            <span className="text-sm font-medium" style={{ color: style.color }}>
                {status}
            </span>
        </Flex>
    );
};

interface AttendanceTableProps {
    records: DashboardAttendanceRow[];
}

// Design spec: table header text uses weight 500 and color #42526D (font-size unchanged).
const HeaderText = ({ children }: { children: string }) => (
    <span style={{ fontWeight: 500, color: '#42526D' }}>{children}</span>
);

const columns: ColumnsType<DashboardAttendanceRow> = [
    {
        title: <HeaderText>Date</HeaderText>,
        dataIndex: 'name',
        key: 'name',
        render: (value: string) => (
            <span className="text-sm font-medium text-[#101828]">{value}</span>
        ),
    },
    {
        title: <HeaderText>Checkin</HeaderText>,
        dataIndex: 'joinDate',
        key: 'joinDate',
        render: (value: string) => (
            <Flex align="center" gap={9}>
                <span className="rounded-full size-[13px] bg-[#05BE63]" />
                <span className="text-sm font-bold text-[#101828]">{value}</span>
            </Flex>
        ),
    },
    {
        title: <HeaderText>Checkout</HeaderText>,
        dataIndex: 'checkout',
        key: 'checkout',
        render: (value: string) => (
            <Flex align="center" gap={6}>
                <img src={WatchIcon} alt="" className="size-7" />
                <span className="text-sm font-bold text-[#101828]">{value}</span>
            </Flex>
        ),
    },
    {
        title: <HeaderText>Hours</HeaderText>,
        dataIndex: 'hours',
        key: 'hours',
        render: (value: string) => (
            <span className="text-sm font-bold text-[#101828]">{value}</span>
        ),
    },
    {
        title: <HeaderText>Status</HeaderText>,
        dataIndex: 'status',
        key: 'status',
        render: (status: DashboardAttendanceStatus) => <StatusBadge status={status} />,
    },
];

const AttendanceTable = ({ records }: AttendanceTableProps) => (
    <Flex
        vertical
        className="h-full overflow-hidden bg-white border border-solid rounded-[18px] border-[#eff1f4]"
    >
        <Table
            rowKey="id"
            columns={columns}
            dataSource={records}
            pagination={false}
            scroll={{ x: 'max-content' }}
            className="employee-attendance-table"
        />
    </Flex>
);

export default AttendanceTable;
