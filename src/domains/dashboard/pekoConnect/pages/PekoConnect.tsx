import { lazy, Suspense, useState } from 'react';

import { Spin } from 'antd';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

import CorporateList from '../components/CorporateList';
import { useGetRequests } from '../hooks/useGetRequests';

const ConnectionModal = lazy(() => import('../components/ConnectionModal'));

const PekoConnect = () => {
    const [connection, setConnection] = useState(false);
    const handleConnection = () => setConnection(true);
    const { requests, refresh, isLoading } = useGetRequests();
    useHideWidgetOnDrawer(true);

    return (
        <div className="-mx-[15px] -my-[18px] sm:-mt-[50px] md:-mx-[0px] md:-my-[0px] md:-mt-[0px] relative min-h-[calc(100dvh-8rem)] xl:min-h-[calc(100dvh-10rem)] xxl:min-h-[calc(100dvh-14.5rem)]">
            <div className="absolute inset-0">
                <CorporateList
                    requests={requests}
                    refresh={refresh}
                    isLoading={isLoading}
                    handleConnection={handleConnection}
                />
            </div>
            {connection && (
                <Suspense fallback={<Spin />}>
                    <ConnectionModal
                        visible={connection}
                        onCancel={() => setConnection(false)}
                        refresh={refresh}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default PekoConnect;
