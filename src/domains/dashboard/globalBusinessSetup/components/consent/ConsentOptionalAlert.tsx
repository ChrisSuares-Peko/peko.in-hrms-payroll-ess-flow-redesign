import React, { useState } from 'react';

import { ClockCircleFilled } from '@ant-design/icons';
import { Button } from 'antd';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import SendConsentConfirmModal from './SendConsentConfirmModal';
import { refreshConsentStatus, sendConsentViaDocusign } from '../../api/globalBusinessSetup';
import { SubmittedApplication } from '../../types/forms';
import StatusCallout, { CalloutTone } from '../StatusCallout';

interface ConsentOptionalAlertProps {
    application: SubmittedApplication;
    onChanged?: () => void;
}

interface AlertConfig {
    type: CalloutTone;
    title: string;
    description: string;
    buttonLabel: string;
    action: 'send' | 'refresh';
}

// DocuSign consent flow (vendor's ConsentOptionalAlert). Hidden once consent
// is received, or while the legacy email flow owns the alert space.
const ConsentOptionalAlert: React.FC<ConsentOptionalAlertProps> = ({ application, onChanged }) => {
    const dispatch = useDispatch();
    const { role, id: userId } = useAppSelector(s => s.reducer.auth);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const consentStatus = application.consent?.status;
    const docusignStatus = application.consent?.docusign?.status;
    const clientName = application.client_name || 'the client';

    // Consent already completed — nothing to show, payment is unlocked.
    if (consentStatus === 'received') return null;

    // The email-consent flow shows its own alert when in progress.
    if (
        application.consent_required &&
        (consentStatus === 'pending' || consentStatus === 'rejected')
    ) {
        return null;
    }

    let config: AlertConfig;
    if (docusignStatus === 'sent' || docusignStatus === 'delivered') {
        config = {
            type: 'info',
            title: 'Awaiting Client Signature',
            description: `The consent has been sent to ${clientName} for e-signature. Payment unlocks once they sign — use Refresh to check the latest status.`,
            buttonLabel: 'Refresh',
            action: 'refresh',
        };
    } else if (docusignStatus === 'declined' || docusignStatus === 'voided') {
        config = {
            type: 'error',
            title: 'Consent Not Completed',
            description: `${clientName} did not complete the consent. Resend the document to continue.`,
            buttonLabel: 'Resend',
            action: 'send',
        };
    } else {
        config = {
            type: 'warning',
            title: 'Client Consent Required',
            description: `Send the consent document to ${clientName} for e-signature. Payment is enabled once the client signs and approves.`,
            buttonLabel: 'Send Consent',
            action: 'send',
        };
    }

    const doSend = async () => {
        setSending(true);
        try {
            await sendConsentViaDocusign({
                userId,
                userType: role,
                applicationId: application._id,
            });
            dispatch(
                showToast({
                    description: 'Consent sent via DocuSign successfully!',
                    variant: 'success',
                })
            );
            setConfirmOpen(false);
            onChanged?.();
        } catch {
            dispatch(showToast({ description: 'Failed to send consent', variant: 'error' }));
        } finally {
            setSending(false);
        }
    };

    const doRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshConsentStatus({
                userId,
                userType: role,
                applicationId: application._id,
            });
            dispatch(showToast({ description: 'Consent status updated', variant: 'success' }));
            onChanged?.();
        } catch {
            dispatch(
                showToast({ description: 'Failed to refresh consent status', variant: 'error' })
            );
        } finally {
            setRefreshing(false);
        }
    };

    const isPending = config.action === 'refresh' ? refreshing : sending;
    const handleAction = () => {
        if (config.action === 'refresh') {
            doRefresh();
        } else {
            setConfirmOpen(true);
        }
    };

    const isRefresh = config.action === 'refresh';

    return (
        <>
            <StatusCallout
                tone={config.type}
                className="mb-4"
                icon={config.type === 'info' ? <ClockCircleFilled /> : undefined}
                title={config.title}
                description={config.description}
                action={
                    <Button
                        type={isRefresh ? 'default' : 'primary'}
                        danger={!isRefresh}
                        loading={isPending}
                        onClick={handleAction}
                    >
                        {config.buttonLabel}
                    </Button>
                }
            />
            <SendConsentConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={doSend}
                loading={sending}
                clientName={application.client_name}
                clientEmail={application.client_email}
            />
        </>
    );
};

export default ConsentOptionalAlert;
