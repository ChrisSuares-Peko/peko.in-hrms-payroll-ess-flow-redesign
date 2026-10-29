import React, { useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import emptyWalletImg from '../assets/icons/empty-wallet.svg';
import moneySendImg from '../assets/icons/money-send.svg';
import statusUpImg from '../assets/icons/status-up.svg';
import DocumentList from '../components/shared/DocumentList';
import useDocumentStats from '../hooks/documents/useDocumentStats';
import { StatCardItem } from '../types';
import { DocumentRow } from '../types/documents';
import { formatAmount } from '../utils/helperFunctions';
import getInvoiceColumns from '../utils/table_column/invoiceColumns';

const Invoice: React.FC = () => {
    const navigate = useNavigate();
    const { stats: rawStats, isLoading: statsLoading } = useDocumentStats('INVOICE');

    const stats = useMemo<StatCardItem[]>(
        () => [
            {
                id: 'total',
                value: String(rawStats?.totalInvoices || 0),
                label: 'Total Invoices',
                bgColor: '#FDF6F0',
                icon: statusUpImg,
            },
            {
                id: 'paid',
                value: formatAmount(rawStats?.totalReceived || 0),
                label: 'Total Paid',
                bgColor: '#ECF0FC',
                icon: emptyWalletImg,
            },
            {
                id: 'due',
                value: formatAmount(rawStats?.outstandingAmount || 0),
                label: 'Total Due Amount',
                bgColor: '#EBF6F1',
                icon: moneySendImg,
            },
        ],
        [rawStats]
    );

    const handleEdit = (row: DocumentRow) => {
        navigate(`${paths.sales.editInvoice.replace(':id', row.id)}`);
    };
    const handleView = (id: string) => {
        navigate(`${paths.sales.invoicedetails.replace(':id', id)}`);
    };

    return (
        <DocumentList
            documentType="INVOICE"
            pageTitle="Invoices"
            createLabel="Create Invoice"
            onCreateClick={() => navigate(paths.sales.createInvoice)}
            stats={stats}
            statsLoading={statsLoading}
            listTitle="Invoice List"
            searchPlaceholder="Search Invoice..."
            columns={(onDelete, statusFilter, onMarkAsPaid) =>
                getInvoiceColumns(handleEdit, onDelete, handleView, statusFilter, onMarkAsPaid)
            }
        />
    );
};

export default Invoice;
