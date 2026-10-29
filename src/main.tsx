/* eslint-disable import/order */
import React, { Suspense } from 'react';

import { Skeleton } from 'antd';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '@store/store';

import App from './App';
import './index.css';
import { handleLogout } from './services/handleLogout';

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

// PROTOTYPE-SETUP: IncomingCallListener (Peko Connect calls over Peko's production Firebase/Firestore) is
// no longer mounted around the app; the prototype must not open listeners on Peko's Firebase project.
const Main = () => (
    <BrowserRouter>
        <Suspense fallback={<Skeleton />}>
            <App />
        </Suspense>
    </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <Main />
        </PersistGate>
    </Provider>
);
