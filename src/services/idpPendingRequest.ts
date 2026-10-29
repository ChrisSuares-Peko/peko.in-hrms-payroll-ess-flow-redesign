import { jwtDecode, JwtPayload } from 'jwt-decode';

/**
 * Holds a pending OIDC *authorization request* across a login that navigates away from the SPA.
 *
 * When a relying party sends the user to the backend's /authorize, it redirects to
 * `/auth/login?token=<JWT>`. That JWT is the entire state of the request — client_id,
 * redirect_uri, scope, state, code_challenge — and nothing is stored server-side until consent
 * is granted. A manual login keeps it because the SPA never unloads, but "Sign in with SSO" is a
 * full-page navigation out to the external IdP, which takes the URL (and the token) with it.
 *
 * sessionStorage rather than localStorage on purpose: it survives the round trip out and back in
 * the SAME tab, but is invisible to every other tab, so a portal tab opened meanwhile can never
 * consume someone else's pending request.
 */
const STORAGE_KEY = 'idp_pending_request';

type PendingIdpRequest = {
    token: string;
    /** Epoch seconds, taken from the token's own `exp` (the backend issues it with 1h). */
    exp: number;
};

const read = (): PendingIdpRequest | null => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingIdpRequest;
        return parsed?.token ? parsed : null;
    } catch {
        return null;
    }
};

export const clearPendingIdpToken = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage unavailable (private mode / blocked) — nothing to clear.
    }
};

/**
 * Stores the pending request. Only the authorize-shaped token belongs here: the
 * /direct-active-session bridge token reaching the same URL carries `redirectURI` and is handled
 * by GuestGuard instead, so callers must not pass it.
 */
export const savePendingIdpToken = (token: string) => {
    if (!token) return;
    try {
        const { exp } = jwtDecode<JwtPayload>(token);
        // No exp means we cannot bound it; treat as unusable rather than storing indefinitely.
        if (!exp) return;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, exp }));
    } catch {
        // Malformed token — ignore rather than throwing during a render.
    }
};

/** Non-destructive check, for callers that only need to know whether one is waiting. */
export const peekPendingIdpToken = (): string | null => {
    const pending = read();
    if (!pending) return null;
    if (pending.exp <= Date.now() / 1000) {
        clearPendingIdpToken();
        return null;
    }
    return pending.token;
};

/**
 * Returns the pending token and clears it — the request is resumed exactly once. Returns null
 * when there is none or it has expired (the backend would reject an expired token anyway).
 */
export const takePendingIdpToken = (): string | null => {
    const token = peekPendingIdpToken();
    clearPendingIdpToken();
    return token;
};
