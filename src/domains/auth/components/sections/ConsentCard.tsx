import { Button, Flex, Image, Typography } from 'antd';

import logo from '@assets/mainLogo/standard';

import { getConsentScope } from '../../utils/consentScopes';

type ConsentCardProps = {
    clientName?: string;
    clientId?: string;
    scope?: string;
    btnLoading: boolean;
    onAllow: () => void;
    onDeny: () => void;
};

const ConsentCard = ({
    clientName,
    clientId,
    scope,
    btnLoading,
    onAllow,
    onDeny,
}: ConsentCardProps) => {
    const appName = clientName || clientId || 'An application';
    const scopes = scope ? scope.trim().split(/\s+/).filter(Boolean) : [];

    return (
        <Flex vertical className="w-full sm:w-[26rem] bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <Image src={logo} alt="Peko" preview={false} width={140} className="-ms-1" />

            <div className="mt-4 mb-5 border-t border-borderGray" />

            <Typography.Text className="text-xs font-semibold uppercase tracking-wider text-textGray">
                Authorization Request
            </Typography.Text>

            <Typography.Text className="mt-2 text-xl font-semibold text-textBlackGray">
                <span className="text-brandColor">{appName}</span> is requesting access to your
                account
            </Typography.Text>

            {scopes.length > 0 && (
                <>
                    <Typography.Text className="mt-4 text-sm text-textGray">
                        This will give {appName} access to:
                    </Typography.Text>

                    <Flex vertical gap={14} className="mt-3">
                        {scopes.map(key => {
                            const { title, description, Icon } = getConsentScope(key);
                            return (
                                <Flex key={key} gap={12} align="flex-start">
                                    <Flex
                                        align="center"
                                        justify="center"
                                        className="mt-0.5 h-9 w-9 flex-shrink-0 rounded-full bg-bgIconCard text-base text-brandColor"
                                    >
                                        <Icon />
                                    </Flex>
                                    <Flex vertical gap={2} className="min-w-0">
                                        <Typography.Text className="text-sm font-medium text-textBlackGray">
                                            {title}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-textGray">
                                            {description}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                </>
            )}

            <Flex gap={12} className="mt-7 w-full">
                <Button
                    type="primary"
                    danger
                    size="large"
                    loading={btnLoading}
                    onClick={onAllow}
                    className="flex-1 font-semibold"
                >
                    Allow
                </Button>

                <Button danger size="large" onClick={onDeny} className="flex-1 font-semibold">
                    Deny
                </Button>
            </Flex>

            <Typography.Text className="mt-5 text-center text-xs text-textGray">
                You can revoke access at any time from your account settings
            </Typography.Text>
        </Flex>
    );
};

export default ConsentCard;
