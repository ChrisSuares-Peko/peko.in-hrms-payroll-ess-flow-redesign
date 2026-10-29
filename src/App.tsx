import { useEffect } from 'react';

import AntdConfig from './antd.config';
import PrivacyPolicyGate from './components/molecular/modals/PrivacyPolicyGate';
import useCustomNotification from './hooks/useCustomNotification';
import { useScrollToTop } from './hooks/useScrollToTop';
import Router from './routes/sections';
import { clearData } from './services/handleLogout';
import { TAB_ID } from './utils/tabId';

function App() {
    useScrollToTop();
    const { contextHolder } = useCustomNotification();
    const authChannel = new BroadcastChannel('authChannel');

    useEffect(() => {
        const handleAuthBroadcast = (event: any) => {
            const message = event.data;
            if (message === 'logout') {
                clearData();
                return;
            }
            // A login happened in another tab — reload so this tab adopts the new
            // session. Skip the tab that performed the login (it tags its own TAB_ID).
            const isLogin = message === 'login' || message?.type === 'login';
            if (isLogin && message?.tabId !== TAB_ID) {
                window.location.reload();
            }
        };

        authChannel.addEventListener('message', handleAuthBroadcast);

        return () => {
            authChannel.removeEventListener('message', handleAuthBroadcast);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AntdConfig>
            {contextHolder}
            <Router />
            <PrivacyPolicyGate />
        </AntdConfig>
    );
}

export default App;
