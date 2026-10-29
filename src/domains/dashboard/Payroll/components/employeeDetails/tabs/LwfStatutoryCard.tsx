import React, { useState } from 'react';

import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import StatutoryCardShell from './StatutoryCardShell';
import { LWF_INFO } from './statutoryInfoContent';
import { LwfCardData, LwfConfig } from '../../../hooks/employeeProfileHooks/useEmployeeStatutoryDetails';
import UpdateLwfAmountModal from '../modals/UpdateLwfAmountModal';

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const nextDeductionLabel = (data: LwfCardData) => {
    if (!data.isActive || !data.scheduleLabel) return '—';
    if (data.fires) return 'This month';
    if (data.nextFireMonth != null && data.nextFireYear != null) {
        return `${MONTH_NAMES_SHORT[data.nextFireMonth - 1]} ${data.nextFireYear}`;
    }
    return '—';
};

interface LwfStatutoryCardProps {
    employeeName: string;
    data: LwfCardData;
    toggleLoading?: boolean;
    isSaving?: boolean;
    onToggle: (checked: boolean) => void;
    onSaveConfig: (config: LwfConfig) => Promise<any>;
}

const LwfStatutoryCard = ({ employeeName, data, toggleLoading, isSaving, onToggle, onSaveConfig }: LwfStatutoryCardProps) => {
    const [modalOpen, setModalOpen] = useState(false);

    // Ordered [Work State, Schedule, Contribution, Next Deduction] — StatutoryCardShell
    // lays fields out as an alternating 2-column grid, so this order groups Work
    // State+Contribution in the left column and Schedule+Next Deduction in the right,
    // stacked top-to-bottom within each.
    const scheduleFields = data.isActive
        ? [
              {
                  label: 'Work State',
                  value: data.resolvedWorkState
                      ? `${data.resolvedWorkState}${data.workStateIsOrgDefault ? ' · org default' : ''}`
                      : 'Not configured',
              },
              {
                  label: 'Schedule',
                  value: data.scheduleLabel ? `Deducted ${data.scheduleLabel}` : 'Not configured',
              },
              {
                  label: 'Contribution',
                  value: `₹${formatNumberWithLocalStringWithoutDecimalPoint(Math.round(data.employeeAmount))} employee · ₹${formatNumberWithLocalStringWithoutDecimalPoint(Math.round(data.employerAmount))} employer (company-paid)`,
              },
              {
                  label: 'Next Deduction',
                  value: nextDeductionLabel(data),
              },
          ]
        : [
              { label: 'Work State', value: '—' },
              { label: 'Schedule', value: '—' },
              { label: 'Contribution', value: '—' },
              { label: 'Next Deduction', value: '—' },
          ];

    return (
        <>
            <StatutoryCardShell
                title="Labour Welfare Fund"
                statusText={data.isActive ? 'Active' : 'Inactive'}
                statusPositive={data.isActive}
                actionLabel="Update Amount"
                onAction={() => setModalOpen(true)}
                showToggle
                toggleChecked={data.isActive}
                toggleLoading={toggleLoading}
                onToggle={onToggle}
                infoContent={LWF_INFO}
                fields={scheduleFields}
            />
            {modalOpen && (
                <UpdateLwfAmountModal
                    open={modalOpen}
                    employeeName={employeeName}
                    initialConfig={{
                        // Pre-fills with whatever's actually driving this employee's
                        // schedule right now — their own override if set, else the org
                        // default (data.resolvedWorkState) — rather than opening blank
                        // when they're really just inheriting Maharashtra from Compliance
                        // Settings.
                        workState: data.workState || data.resolvedWorkState,
                        scheduleOverride: data.scheduleOverride,
                        employeeShareType: data.employeeShareType,
                        employeeShareValue: data.employeeShareValue,
                        employerShareType: data.employerShareType,
                        employerShareValue: data.employerShareValue,
                    }}
                    isLoading={isSaving}
                    onCancel={() => setModalOpen(false)}
                    onSave={onSaveConfig}
                />
            )}
        </>
    );
};

export default LwfStatutoryCard;
