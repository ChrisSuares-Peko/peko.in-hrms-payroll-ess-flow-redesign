import React, { useState } from 'react';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import StatutoryCardShell from './StatutoryCardShell';
import { ESI_INFO } from './statutoryInfoContent';
import { EsiCardData } from '../../../hooks/employeeProfileHooks/useEmployeeStatutoryDetails';
import UpdateStatutoryTextModal from '../modals/UpdateStatutoryTextModal';

interface EsiStatutoryCardProps {
    data: EsiCardData;
    toggleLoading?: boolean;
    onToggle: (checked: boolean) => void;
    onUpdateEsiNumber: (value: string) => Promise<any>;
}

// Coverage itself is always determined automatically by the gross ceiling (see
// resolveEsi) — this toggle is a manual OPT-OUT override on top of that, not the gate
// itself: ON (the default) means the ceiling rule alone decides, so the status text below
// can still read "Not Covered" while the toggle is ON, same as it can read "Covered" —
// only switching it OFF forces ESI off regardless of gross.
const EsiStatutoryCard = ({ data, toggleLoading, onToggle, onUpdateEsiNumber }: EsiStatutoryCardProps) => {
    const [modalOpen, setModalOpen] = useState(false);

    const statusText = data.eligible ? 'Covered' : 'Not Covered';
    const statusPositive = data.eligible;

    return (
        <>
            <StatutoryCardShell
                title="ESI"
                statusText={statusText}
                statusPositive={statusPositive}
                actionLabel="Update ESI Number"
                onAction={() => setModalOpen(true)}
                showToggle
                toggleChecked={data.isActive}
                toggleLoading={toggleLoading}
                onToggle={onToggle}
                infoContent={ESI_INFO}
                fields={[
                    { label: 'ESI (IP) Number', value: data.esiNumber || '—' },
                    { label: 'Coverage Rule', value: 'Covered while monthly gross ≤ ₹21,000' },
                    {
                        label: 'Monthly Gross Salary',
                        value: `₹${formatNumberWithLocalStringWithoutDecimalPoint(Math.round(data.grossSalary))}`,
                    },
                    { label: 'Contribution', value: 'Employee 0.75% · Employer 3.25% of gross' },
                ]}
            />
            {modalOpen && (
                <UpdateStatutoryTextModal
                    open={modalOpen}
                    title="Update ESI Number"
                    label="ESI (IP) Number"
                    fieldKey="esiNumber"
                    initialValue={data.esiNumber}
                    handleCancel={() => setModalOpen(false)}
                    onSave={(_fieldKey, value) => onUpdateEsiNumber(value)}
                />
            )}
        </>
    );
};

export default EsiStatutoryCard;
