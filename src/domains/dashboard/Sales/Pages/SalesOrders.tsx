import React, { useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import moneySendImg from '../assets/icons/money-send.svg';
import statusUpImg from '../assets/icons/status-up.svg';
import walletCheckImg from '../assets/icons/wallet-check.svg';
import DocumentList from '../components/shared/DocumentList';
import useDocumentStats from '../hooks/documents/useDocumentStats';
import { StatCardItem } from '../types';
import { DocumentRow } from '../types/documents';
import getSalesOrderColumns from '../utils/table_column/salesOrderColumns';

const SalesOrders: React.FC = () => {
    const navigate = useNavigate();
    const { stats: rawStats, isLoading: statsLoading } = useDocumentStats('SALES_ORDER');

    const stats = useMemo<StatCardItem[]>(
        () => [
            {
                id: 'total',
                value: String(rawStats?.totalOrders || 0),
                label: 'Total Orders',
                bgColor: '#FDF6F0',
                icon: statusUpImg,
            },
            {
                id: 'pending',
                value: String(rawStats?.pending || 0),
                label: 'Pending',
                bgColor: '#ECF0FC',
                icon: walletCheckImg,
            },
            {
                id: 'completed',
                value: String(rawStats?.completed || 0),
                label: 'Completed',
                bgColor: '#EBF6F1',
                icon: moneySendImg,
            },
        ],
        [rawStats]
    );

    const handleEdit = (row: DocumentRow) => {
        navigate(`${paths.sales.editSalesOrder.replace(':id', row.id)}`);
    };
    const handleView = (id: string) => {
        navigate(`${paths.sales.salesOrderDetails.replace(':id', id)}`);
    };
    const handleConvertToInvoice = (row: DocumentRow) => {
        navigate(
            `/${paths.sales.index}/${paths.sales.invoices}/${paths.sales.createInvoice}`,
            { state: { fromSalesOrderId: row.id } }
        );
    };

    return (
        <DocumentList
            documentType="SALES_ORDER"
            pageTitle="Sales Orders"
            createLabel="Create Sales Order"
            onCreateClick={() => navigate(paths.sales.createSalesOrder)}
            stats={stats}
            statsLoading={statsLoading}
            listTitle="Sales Order List"
            searchPlaceholder="Search Order..."
            columns={(onDelete, statusFilter) =>
                getSalesOrderColumns(handleEdit, onDelete, handleView, handleConvertToInvoice, statusFilter)
            }
        />
    );
};

export default SalesOrders;
