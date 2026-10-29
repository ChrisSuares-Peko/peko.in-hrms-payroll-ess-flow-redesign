import React from 'react';

import { Skeleton } from 'antd';

import type { RecurringSourceInvoice } from '../../../types/recurring';

type Props = { sourceInvoice: RecurringSourceInvoice | undefined; isLoading: boolean };

const RecurringCustomerCard: React.FC<Props> = ({ sourceInvoice, isLoading }) => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

    if (!sourceInvoice?.name)
        return <p className="text-sm text-gray-400">No customer info available.</p>;

    return (
        <div className="space-y-1 text-sm">
            <p className="font-semibold text-gray-900">{sourceInvoice.name}</p>
            {sourceInvoice.email && <p className="text-gray-500">{sourceInvoice.email}</p>}
            {sourceInvoice.phoneNumber && (
                <p className="text-gray-500">{sourceInvoice.phoneNumber}</p>
            )}
            {sourceInvoice.address && <p className="text-gray-500">{sourceInvoice.address}</p>}
        </div>
    );
};

export default RecurringCustomerCard;
