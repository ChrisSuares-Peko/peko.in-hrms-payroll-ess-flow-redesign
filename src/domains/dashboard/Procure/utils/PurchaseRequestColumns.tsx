import { ArrowUpOutlined } from '@ant-design/icons';
import { Avatar, Button, Flex, Tag } from 'antd';
import type { TableColumnsType } from 'antd';

type StatusKey = 'Draft' | 'Open' | 'Converted to RFQ' | 'Converted to PO' | 'Cancelled' | 'Rejected';

const statusConfig: Record<StatusKey, { color: string; bg: string }> = {
    'Draft':            { color: '#595959', bg: '#F5F5F5' },
    'Open':             { color: '#03A254', bg: '#DDFFEE' },
    'Converted to RFQ': { color: '#B75C12', bg: '#FFF2E8' },
    'Converted to PO':  { color: '#7B07B1', bg: '#FCF5FF' },
    'Cancelled':        { color: '#CF1322', bg: '#FFF1F0' },
    'Rejected':         { color: '#CF1322', bg: '#FFF1F0' },
};

const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateNeedBY = (date: string | Date | null | undefined): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const getInitials = (name: string) =>
    name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

type ColumnActions = {
    onView: (row: any) => void;
    onViewLinkedRFQ?: (row: any) => void;
    onViewLinkedPO?: (row: any) => void;
    onContinue?: (row: any) => void;
    onCancel?: (row: any) => void;
    onReopen?: (row: any) => void;
};

export const getPurchaseRequestColumns = ({
    onView,
    onViewLinkedRFQ,
    onViewLinkedPO,
    onContinue,
    onCancel,
    onReopen,
}: ColumnActions): TableColumnsType<any> => [
    { title: 'Date',         dataIndex: 'createdAt',        key: 'createdAt',        width: 120,
      render: (val: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(val)}</span> },
    { title: 'Ref #',        dataIndex: 'refNumber',        key: 'refNumber',        width: 130,
      render: (val: string) => <span style={{ whiteSpace: 'nowrap' }}>{val}</span> },
    {
        title: 'Requested By', dataIndex: 'requestedBy', key: 'requestedBy', width: 220,
        render: (name: string) => (
            <Flex align="center" gap={8}>
                <Avatar size={34} style={{ background: '#FFEFEF', color: '#FF4F4F', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                    {getInitials(name ?? '')}
                </Avatar>
                <span style={{ fontWeight: 500 }}>{name}</span>
            </Flex>
        ),
    },
    { title: 'Department',   dataIndex: 'department',       key: 'department',       width: 130 },
    { title: 'Category',     dataIndex: 'category',         key: 'category',         width: 220 },
    { title: 'Budget (₹)',   dataIndex: 'estimatedBudget',  key: 'estimatedBudget',  width: 140,
      render: (val: string, row: any) => val ? `${row.currency === 'INR' ? '₹' : (row.currency ?? '₹')} ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A' },
    { title: 'Needed By',    dataIndex: 'neededBy',         key: 'neededBy',         width: 130,
      render: (val: string) => formatDateNeedBY(val) },
    {
        title: 'Status', dataIndex: 'status', key: 'status', width: 140,
        render: (status: string) => {
            const cfg = statusConfig[status as StatusKey] ?? { color: '#595959', bg: '#F5F5F5' };
            return (
                <Tag style={{ color: cfg.color, background: cfg.bg, border: 'none', borderRadius: 20, fontWeight: 500, padding: '4px 10px' }}>
                    ● {status}
                </Tag>
            );
        },
    },
    {
        title: 'Actions', key: 'actions', width: 200,
        render: (_: any, row: any) => {
            const { status }: { status: StatusKey } = row;
            return (
                <Flex align="center" gap={12} style={{ flexWrap: 'nowrap' }}>
                    <Button
                        size="small"
                         variant="outlined" style={{ borderRadius: 8, fontSize: 12 ,borderColor:'#FF4F4F', color:'#FF4F4F' }}
                        onClick={() => onView(row)}
                    >
                        View
                    </Button>
                    {status === 'Converted to RFQ' && (
                        <Button
                            type="link"
                            size="small"
                            style={{ color: '#FF4F4F', padding: 0, fontWeight: 500, fontSize: 12 }}
                            icon={<ArrowUpOutlined rotate={45} />}
                            iconPosition="end"
                            onClick={() => onViewLinkedRFQ?.(row)}
                        >
                            View linked RFQ
                        </Button>
                    )}
                    {status === 'Converted to PO' && (
                        <Button
                            type="link"
                            size="small"
                            style={{ color: '#FF4F4F', padding: 0, fontWeight: 500, fontSize: 12 }}
                            icon={<ArrowUpOutlined rotate={45} />}
                            iconPosition="end"
                            onClick={() => onViewLinkedPO?.(row)}
                        >
                            View linked PO
                        </Button>
                    )}
                    {status === 'Draft' && (
                        <Button
                            size="small"
                            style={{ borderColor: 'rgb(203, 213, 225)', color: '#475569', borderRadius: 8, fontSize: 12 }}
                            onClick={() => onContinue?.(row)}
                        >
                            Edit
                        </Button>
                    )}
                    {status === 'Open' && (
                        <Button
                            size="small"
                            style={{ borderColor: 'rgb(203, 213, 225)', color: '#475569', borderRadius: 8, fontSize: 12 }}
                            onClick={() => onCancel?.(row)}
                        >
                            Cancel
                        </Button>
                    )}
                    {status === 'Cancelled' && (
                        <Button
                            size="small"
                            style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8, fontSize: 12 }}
                            onClick={() => onReopen?.(row)}
                        >
                            Re-open
                        </Button>
                    )}
                </Flex>
            );
        },
    },
];
