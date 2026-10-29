import React from 'react';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import StatutoryCardShell from './StatutoryCardShell';
import { TDS_INFO } from './statutoryInfoContent';
import { TdsCardData } from '../../../hooks/employeeProfileHooks/useEmployeeStatutoryDetails';

interface TdsStatutoryCardProps {
    data: TdsCardData;
    onNavigateToBasicInfo: () => void;
}

const TdsStatutoryCard = ({ data, onNavigateToBasicInfo }: TdsStatutoryCardProps) => {
    const regimeLabel = data.taxRegime === 'Old Tax Regime' ? 'Old regime' : 'New regime';

    return (
        <StatutoryCardShell
            title="Income Tax (TDS)"
            actionLabel="Update PAN in Basic Information"
            onAction={onNavigateToBasicInfo}
            infoContent={TDS_INFO}
            fields={[
                { label: 'PAN', value: data.panNumber || '—' },
                {
                    label: 'Standard Deduction',
                    value: `₹${formatNumberWithLocalStringWithoutDecimalPoint(data.standardDeduction)} / year (${regimeLabel})`,
                },
                { label: 'Tax Regime', value: regimeLabel },
                { label: 'Included in TDS & Form 24Q Filings', value: data.isActive ? 'Yes' : 'No' },
            ]}
        />
    );
};

export default TdsStatutoryCard;
