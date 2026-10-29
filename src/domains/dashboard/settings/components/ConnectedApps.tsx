import { Empty, Flex, Skeleton, Typography } from 'antd';

import ConnectedAppCard from './connectedApps/ConnectedAppCard';
import useConnectedApps from '../hooks/connectedApps/useConnectedApps';

const ConnectedApps = () => {
    const { apps, isLoading, isRevoking, revokeApp } = useConnectedApps();

    return (
        <Flex vertical className="gap-5 rounded-md sm:mt-4">
            <Flex vertical gap={4}>
                <Typography.Text className="text-base font-medium">Connected Apps</Typography.Text>
                <Typography.Text className="text-sm text-textGray">
                    Third-party apps you&apos;ve granted access to your Peko account. Revoke any app
                    you no longer use.
                </Typography.Text>
            </Flex>

            {isLoading && <Skeleton active avatar paragraph={{ rows: 3 }} />}

            {!isLoading && apps.length === 0 && (
                <Empty description="No connected apps" className="mt-6" />
            )}

            {!isLoading && apps.length > 0 && (
                <Flex vertical gap={16}>
                    {apps.map(app => (
                        <ConnectedAppCard
                            key={app.id}
                            app={app}
                            onRevoke={revokeApp}
                            isLoading={isRevoking}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    );
};

export default ConnectedApps;
