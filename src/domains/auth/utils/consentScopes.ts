import type { ComponentType } from 'react';

import {
    EnvironmentOutlined,
    IdcardOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyOutlined,
    SyncOutlined,
    UserOutlined,
} from '@ant-design/icons';

export type ConsentScope = {
    title: string;
    description: string;
    Icon: ComponentType<{ className?: string }>;
};

// Human-readable descriptions for the OAuth scopes requested on the consent screen.
// The backend only sends the raw scope string, so the friendly copy lives here.
export const CONSENT_SCOPES: Record<string, ConsentScope> = {
    openid: {
        title: 'Verify your identity',
        description: 'Confirm who you are with your Peko account.',
        Icon: IdcardOutlined,
    },
    profile: {
        title: 'Basic profile',
        description: 'Your name, username and profile picture.',
        Icon: UserOutlined,
    },
    email: {
        title: 'Email address',
        description: 'See the email address on your account.',
        Icon: MailOutlined,
    },
    phone: {
        title: 'Phone number',
        description: 'See the phone number on your account.',
        Icon: PhoneOutlined,
    },
    offline_access: {
        title: 'Offline access',
        description: "Stay connected and keep access when you're not actively using the app.",
        Icon: SyncOutlined,
    },
    address: {
        title: 'Address',
        description: 'See the postal address on your account.',
        Icon: EnvironmentOutlined,
    },
};

const humanize = (key: string) => {
    const text = key.replace(/_/g, ' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
};

// Falls back gracefully for any scope not in the map above.
export const getConsentScope = (key: string): ConsentScope =>
    CONSENT_SCOPES[key] ?? {
        title: humanize(key),
        description: 'Access to this information.',
        Icon: SafetyOutlined,
    };
