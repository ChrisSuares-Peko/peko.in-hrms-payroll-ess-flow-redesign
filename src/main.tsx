/* eslint-disable import/order */
import React, { Suspense, useState, useEffect } from 'react';

import { Skeleton } from 'antd';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '@store/store';

import App from './App';
import './index.css';
import { handleLogout } from './services/handleLogout';
import IncomingCallListener from './domains/dashboard/pekoConnect/components/IncomingCallListener';
import { useAppSelector } from './hooks/store';
import './moengage-init';

window.addEventListener('vite:preloadError', (event: any) => {
    console.error('Vite preload error:', event);
    if (
        event.payload &&
        event.payload.message.includes('Failed to fetch dynamically imported module')
    ) {
        handleLogout();
    }
    // window.location.reload(); // Refresh the page in case of preload error
});

const Main = () => {
    const [userId, setUserId] = useState('');
    const { user } = useAppSelector(state => state.reducer.user);

    useEffect(() => {
        if (user) {
            setUserId(user.username || '');
        }
    }, [user]);

    return (
        <BrowserRouter>
            <Suspense fallback={<Skeleton />}>
                <IncomingCallListener userId={userId}>
                    <App />
                </IncomingCallListener>
            </Suspense>
        </BrowserRouter>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <Main />
        </PersistGate>
    </Provider>
);
