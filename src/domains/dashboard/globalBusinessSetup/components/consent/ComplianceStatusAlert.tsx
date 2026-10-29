import React from 'react';

import { Typography } from 'antd';

import { SubmittedApplication } from '../../types/forms';
import StatusCallout from '../StatusCallout';

interface ComplianceStatusAlertProps {
    application: SubmittedApplication;
}

// Read-only compliance alert (vendor's agent-side ComplianceStatusAlert).
// Renders when screening flagged/blocked the application, or errored before
// completing (payment stays on hold until the check is re-run).
const ComplianceStatusAlert: React.FC<ComplianceStatusAlertProps> = ({ application }) => {
    const { compliance } = application;
    if (!compliance || !['flagged', 'blocked', 'error'].includes(compliance.status)) return null;

    const isBlocked = compliance.status === 'blocked';
    const isError = compliance.status === 'error';

    if (isError) {
        return (
            <StatusCallout
                tone="warning"
                className="mb-4"
                title="Compliance Screening Incomplete"
                description="Compliance screening could not be completed for this application. It will be re-run by our team; payment stays on hold until it completes."
            />
        );
    }

    const flaggedEntities = (compliance.checks ?? [])
        .flatMap(check => check.entities ?? [])
        .filter(entity => entity.state !== 'done' && entity.state !== 'skipped')
        .map(entity => entity.name)
        .filter(Boolean);
    const uniqueNames = Array.from(new Set(flaggedEntities));

    return (
        <StatusCallout
            tone={isBlocked ? 'error' : 'warning'}
            className="mb-4"
            title={isBlocked ? 'Blocked by Compliance' : 'Compliance Flags Detected'}
            description={
                <>
                    <Typography.Text className="text-sm text-neutral-600">
                        {isBlocked
                            ? 'Compliance screening blocked this application. It cannot proceed to payment until resolved.'
                            : 'Compliance screening raised flags on this application. Payment is on hold until they are reviewed.'}
                    </Typography.Text>
                    {uniqueNames.length > 0 && (
                        <div className="mt-1">
                            <Typography.Text className="text-xs text-neutral-500">
                                Flagged: {uniqueNames.join(', ')}
                            </Typography.Text>
                        </div>
                    )}
                </>
            }
        />
    );
};

export default ComplianceStatusAlert;
