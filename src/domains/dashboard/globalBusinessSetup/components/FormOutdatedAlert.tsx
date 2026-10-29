import React from 'react';

import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import StatusCallout from './StatusCallout';
import { FormOutdatedStatus } from '../hooks/useFormOutdated';

type Props = {
    status: FormOutdatedStatus;
    editPath?: string;
};

// Non-blocking warning that the application was saved on an older form version
// (or its form no longer exists). Mirrors PricingStatusAlert's shape.
export default function FormOutdatedAlert({ status, editPath }: Props) {
    const navigate = useNavigate();

    if (status === 'none') return null;

    const isOutdated = status === 'outdated';

    return (
        <StatusCallout
            tone="warning"
            className="mb-4"
            title={isOutdated ? 'Form Outdated' : 'Form Not Available'}
            description={
                isOutdated
                    ? 'The application form for this jurisdiction has been updated since this application was saved. Please review your application against the latest form.'
                    : 'The application form used by this application is no longer available for this jurisdiction. Please contact support.'
            }
            action={
                isOutdated && editPath ? (
                    <Button type="default" danger onClick={() => navigate(editPath)}>
                        Edit Application
                    </Button>
                ) : undefined
            }
        />
    );
}
