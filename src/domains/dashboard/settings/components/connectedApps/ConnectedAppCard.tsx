import { useState } from 'react';

import { AppstoreOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Image, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { getConsentScope } from '@src/domains/auth/utils/consentScopes';

import { ConnectedApp } from '../../types/connectedApps';

interface ConnectedAppCardProps {
    app: ConnectedApp;
    onRevoke: (id: number) => void;
    isLoading: boolean;
}

const ConnectedAppCard = ({ app, onRevoke, isLoading }: ConnectedAppCardProps) => {
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

    const scopeTitles = (app.scopes || []).map(scope => getConsentScope(scope).title);
    const grantedOn = app.grantedAt ? new Date(app.grantedAt).toLocaleDateString() : '';

    return (
        <Col className="w-full p-5 border border-gray-200 border-solid rounded-2xl">
            <Flex vertical gap={12}>
                <Flex justify="space-between" align="center" gap={12}>
                    <Flex align="center" gap={12} className="min-w-0">
                        {app.logo_uri ? (
                            <Image
                                src={app.logo_uri}
                                alt={app.client_name}
                                preview={false}
                                width={40}
                                height={40}
                                className="rounded-lg object-contain"
                            />
                        ) : (
                            <Flex
                                align="center"
                                justify="center"
                                className="h-10 w-10 flex-shrink-0 rounded-lg bg-bgGrayF9 text-lg text-textGray"
                            >
                                <AppstoreOutlined />
                            </Flex>
                        )}
                        <Typography.Text className="text-base font-medium truncate">
                            {app.client_name}
                        </Typography.Text>
                    </Flex>

                    <Button danger onClick={() => setOpenConfirmationModal(true)}>
                        Revoke
                    </Button>
                </Flex>

                {scopeTitles.length > 0 && (
                    <Flex wrap="wrap" gap={8}>
                        {scopeTitles.map(title => (
                            <span
                                key={title}
                                className="rounded-full bg-bgGrayF9 px-3 py-1 text-xs text-textDarkGray"
                            >
                                {title}
                            </span>
                        ))}
                    </Flex>
                )}

                {grantedOn && (
                    <Typography.Text className="text-xs text-textGray">
                        Access granted on {grantedOn}
                    </Typography.Text>
                )}
            </Flex>

            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title={`Revoke access for ${app.client_name}?`}
                description={`${app.client_name} will lose access to your Peko account and will need your permission again the next time you use it.`}
                handleSubmit={() => {
                    onRevoke(app.id);
                    setOpenConfirmationModal(false);
                }}
                isLoading={isLoading}
            />
        </Col>
    );
};

export default ConnectedAppCard;
