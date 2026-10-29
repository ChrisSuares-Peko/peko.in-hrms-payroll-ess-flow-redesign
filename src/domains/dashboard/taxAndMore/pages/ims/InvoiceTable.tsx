import GenericTable from '@src/components/atomic/GenericTable';

import ActionButtons from './ActionButtons';
import { fmt } from './imsUtils';
import { ImsInvoice, ImsInvoiceStatus } from '../../types';

const InvoiceTable = ({
    invoices,
    statuses,
    actioningId,
    onAction,
}: {
    invoices: ImsInvoice[];
    statuses: Record<string, ImsInvoiceStatus>;
    actioningId: string | null;
    onAction: (id: string, s: ImsInvoiceStatus) => void;
}) => {
    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 100,
        },
        {
            title: 'Invoice No',
            dataIndex: 'invoiceNo',
            key: 'invoiceNo',
            width: 160,
            render: (val: string) => <span style={{ whiteSpace: 'nowrap' }}>{val}</span>,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 110,
            render: (val: string) => val || '—',
        },
        {
            title: 'Taxable (₹)',
            dataIndex: 'taxable',
            key: 'taxable',
            width: 130,
            render: (val: number) => `₹ ${fmt(val)}`,
        },
        {
            title: 'Tax (₹)',
            dataIndex: 'tax',
            key: 'tax',
            width: 110,
            render: (val: number) => `₹ ${fmt(val)}`,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 240,
            render: (_: unknown, record: ImsInvoice) => (
                <ActionButtons
                    status={statuses[record.id] ?? record.status}
                    isLoading={actioningId === record.id}
                    onAction={s => onAction(record.id, s)}
                />
            ),
        },
    ];

    const getRowBg = (status: string) => {
        if (status === 'accepted') return '#ECFDF5';
        if (status === 'pending') return '#fffbeb';
        if (status === 'rejected') return '#fef2f2';
        return undefined;
    };

    return (
        <div className="mx-6 mb-4">
            <GenericTable
                dataSource={invoices}
                columns={columns}
                rowKey="id"
                size="small"
                onRow={(record: ImsInvoice) => ({
                    style: { backgroundColor: getRowBg(statuses[record.id] ?? record.status) },
                })}
            />
        </div>
    );
};

export default InvoiceTable;
