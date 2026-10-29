import axios from 'axios';

import { PARTNER_ID, SERVER_URL } from '@src/config-global';
// eslint-disable-next-line import/no-cycle
import { store } from '@store/store';

export const updateRefreshToken = () => {
    const { refreshToken, sessionId, oauth_refreshToken } = store.getState().reducer.auth;
    // The rotation mints a NEW sessionId, so the server cannot find the outgoing session on its own. Sending
    // the current one lets it carry session-only state forward — today, the Admin/Employee mode a sub-corporate
    // Admin switched into, which would otherwise silently reset to their assigned role on every token refresh.
    const response = axios.post(
        `${SERVER_URL}/user/refresh-token`,
        {
            refreshToken,
            ...(oauth_refreshToken
                ? {
                      oauth_refreshToken,
                      registeredBy: PARTNER_ID && PARTNER_ID !== 'null' ? PARTNER_ID : undefined,
                  }
                : {}),
        },
        sessionId ? { headers: { sessionid: sessionId } } : undefined
    );
    return response;
};
