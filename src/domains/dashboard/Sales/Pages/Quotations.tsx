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
import getQuotationColumns from '../utils/table_column/quotationColumns';

const Quotations: React.FC = () => {
    const navigate = useNavigate();
    const { stats: rawStats, isLoading: statsLoading } = useDocumentStats('QUOTATION');

    const stats = useMemo<StatCardItem[]>(
        () => [
            {
                id: 'total',
                value: String(rawStats?.totalQuotations || 0),
                label: 'Total Quotations',
                bgColor: '#FDF6F0',
                icon: statusUpImg,
            },
            {
                id: 'accepted',
                value: String(rawStats?.accepted || 0),
                label: 'Accepted',
                bgColor: '#ECF0FC',
                icon: walletCheckImg,
            },
            {
                id: 'pending',
                value: String(rawStats?.pending || 0),
                label: 'Pending',
                bgColor: '#EBF6F1',
                icon: moneySendImg,
            },
        ],
        [rawStats]
    );

    const handleEdit = (row: DocumentRow) => {
        navigate(`${paths.sales.editQuotation.replace(':id', row.id)}`);
    };
    const handleView = (id: string) => {
        navigate(`${paths.sales.quotationDetails.replace(':id', id)}`);
    };

    return (
        <DocumentList
            documentType="QUOTATION"
            pageTitle="Quotations"
            createLabel="Create Quotation"
            onCreateClick={() => navigate(paths.sales.createQuotation)}
            stats={stats}
            statsLoading={statsLoading}
            listTitle="Quotation List"
            searchPlaceholder="Search Quotation..."
            columns={(onDelete, statusFilter) =>
                getQuotationColumns(
                    handleEdit,
                    onDelete,
                    handleView,
                    statusFilter
                )
            }
        />
    );
};

export default Quotations;
