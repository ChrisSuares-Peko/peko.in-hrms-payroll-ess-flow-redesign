export const SESSION_EXPIRED_COPY = {
    title: 'Your session has expired',
    description:
        "For your security, you've been signed out due to inactivity. You are being logged out from your Peko account.",
} as const;

export const SESSION_EXPIRED_REDIRECT_DELAY_MS = 5 * 1000; // session-expiry page timer
