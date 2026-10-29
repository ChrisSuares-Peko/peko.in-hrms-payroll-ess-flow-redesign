import React, { useState } from 'react';

import { Button } from 'antd';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { sendConsentRequest } from '../../api/globalBusinessSetup';
import { SubmittedApplication } from '../../types/forms';
import StatusCallout from '../StatusCallout';

interface ConsentStatusAlertsProps {
    application: SubmittedApplication;
    onChanged?: () => void;
}

// Legacy email-consent flow (vendor's ConsentStatusAlerts). Renders only when
// the application explicitly requires consent; the DocuSign flow is handled
// by ConsentOptionalAlert.
const ConsentStatusAlerts: React.FC<ConsentStatusAlertsProps> = ({ application, onChanged }) => {
    const dispatch = useDispatch();
    const { role, id: userId } = useAppSelector(s => s.reducer.auth);
    const [sending, setSending] = useState(false);

    const consentStatus = application.consent?.status;
    const clientName = application.client_name || 'the client';

    if (!application.consent_required) return null;
    if (consentStatus !== 'pending' && consentStatus !== 'rejected') return null;

    const resend = async () => {
        setSending(true);
        try {
            await sendConsentRequest({
                userId,
                userType: role,
                applicationId: application._id,
            });
            dispatch(
                showToast({ description: 'Consent request sent successfully', variant: 'success' })
            );
            onChanged?.();
        } catch {
            dispatch(
                showToast({ description: 'Failed to send consent request', variant: 'error' })
            );
        } finally {
            setSending(false);
        }
    };

    if (consentStatus === 'pending') {
        return (
            <StatusCallout
                tone="warning"
                className="mb-4"
                title="Consent Pending"
                description={`A consent mail has been sent to ${clientName}. Payment will be enabled only after the client approves.`}
                action={
                    <Button type="default" danger loading={sending} onClick={resend}>
                        Resend Consent
                    </Button>
                }
            />
        );
    }

    return (
        <StatusCallout
            tone="error"
            className="mb-4"
            title="Consent Rejected"
            description={
                application.consent?.rejection_reason
                    ? `${clientName} rejected the consent: ${application.consent.rejection_reason}`
                    : `${clientName} rejected the consent request.`
            }
            action={
                <Button type="primary" danger loading={sending} onClick={resend}>
                    Resend
                </Button>
            }
        />
    );
};

export default ConsentStatusAlerts;
