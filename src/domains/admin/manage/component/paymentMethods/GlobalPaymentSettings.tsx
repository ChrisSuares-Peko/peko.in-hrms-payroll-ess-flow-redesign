import { ReactNode } from 'react';

import { CreditCardOutlined, IdcardOutlined, TagOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Skeleton, Switch, Tag, Typography } from 'antd';

import { PaymentMethodsState } from '../../types/paymentMethods';

const { Title, Text } = Typography;

const SETTINGS: {
    key: keyof PaymentMethodsState;
    title: string;
    description: string;
    icon: ReactNode;
}[] = [
    {
        key: 'isGatewayPaymentAvailable',
        title: 'Payment gateway',
        description: 'Card, UPI and net banking on the payment screen, for every customer.',
        icon: <CreditCardOutlined />,
    },
    {
        key: 'isWalletPaymentAvailable',
        title: 'Wallet payments',
        description: 'Paying from the wallet balance on the payment screen, for every customer.',
        icon: <WalletOutlined />,
    },
    {
        key: 'isCorporateCardPaymentAvailable',
        title: 'Corporate card payments',
        description:
            'Paying with the Pine Labs corporate card on the payment screen, for every cardholder.',
        icon: <IdcardOutlined />,
    },
    {
        key: 'isCouponApplicable',
        title: 'Coupons',
        description: 'Coupon codes on payment gateway payments.',
        icon: <TagOutlined />,
    },
];

type GlobalPaymentSettingsProps = {
    settings: PaymentMethodsState | null;
    isLoading: boolean;
    isDirty: boolean;
    isSaving: boolean;
    onToggle: (key: keyof PaymentMethodsState, checked: boolean) => void;
    onSave: () => void;
    onDiscard: () => void;
    onRetry: () => void;
};

const GlobalPaymentSettings = ({
    settings,
    isLoading,
    isDirty,
    isSaving,
    onToggle,
    onSave,
    onDiscard,
    onRetry,
}: GlobalPaymentSettingsProps) => {
    let content: ReactNode;
    if (!settings && isLoading) {
        content = (
            <Row gutter={[16, 16]}>
                {SETTINGS.map(({ key }) => (
                    <Col key={key} xs={24} md={6}>
                        <Flex className="h-full rounded-xl border border-borderCard p-4">
                            <Skeleton active title={false} paragraph={{ rows: 3 }} />
                        </Flex>
                    </Col>
                ))}
            </Row>
        );
    } else if (!settings) {
        content = (
            <Flex
                vertical
                align="center"
                gap={12}
                className="rounded-xl border border-dashed border-borderCard py-8"
            >
                <Text className="text-sm text-textBody">
                    The global settings could not be loaded.
                </Text>
                <Button onClick={onRetry}>Try again</Button>
            </Flex>
        );
    } else {
        content = (
            <Row gutter={[16, 16]}>
                {SETTINGS.map(({ key, title, description, icon }) => {
                    const checked = settings[key];
                    const needsGateway =
                        key === 'isCouponApplicable' && !settings.isGatewayPaymentAvailable;
                    return (
                        <Col key={key} xs={24} md={6}>
                            <Flex
                                vertical
                                gap={12}
                                className={`h-full rounded-xl border p-4 transition-colors ${
                                    checked
                                        ? 'border-borderPrimaryLight bg-bgIconCard'
                                        : 'border-borderCard bg-bgLightGray'
                                }`}
                            >
                                <Flex justify="space-between" align="center">
                                    <Flex
                                        align="center"
                                        justify="center"
                                        className={`size-9 rounded-lg bg-white text-base ${
                                            checked ? 'text-brandColor' : 'text-textGreyColor'
                                        }`}
                                    >
                                        {icon}
                                    </Flex>
                                    <Switch
                                        checked={checked}
                                        disabled={isSaving || needsGateway}
                                        onChange={value => onToggle(key, value)}
                                        aria-label={title}
                                    />
                                </Flex>
                                <Flex vertical gap={4}>
                                    <Flex align="center" gap={8}>
                                        <Text className="text-sm font-semibold text-textHeadings">
                                            {title}
                                        </Text>
                                        <Text className="text-xs text-textGreyColor">
                                            {checked ? 'On' : 'Off'}
                                        </Text>
                                    </Flex>
                                    <Text className="text-xs leading-5 text-textBody">
                                        {needsGateway
                                            ? 'Turn on the payment gateway to allow coupons.'
                                            : description}
                                    </Text>
                                </Flex>
                            </Flex>
                        </Col>
                    );
                })}
            </Row>
        );
    }

    return (
        <Flex
            vertical
            gap={16}
            className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6"
        >
            <Flex justify="space-between" align="start" wrap gap={12}>
                <Flex vertical gap={2}>
                    <Title level={5} className="!mb-0">
                        Global settings
                    </Title>
                    <Text className="text-sm text-textBody">
                        Turning an option off here stops it for every customer, whatever their
                        partner&apos;s payment methods allow.
                    </Text>
                </Flex>
                {settings && (
                    <Flex gap={8} align="center" wrap>
                        {isDirty && (
                            <>
                                <Tag className="m-0 rounded-full border border-warning-border bg-warning-surface px-3 py-0.5 text-xs font-medium text-textHeadings">
                                    Unsaved changes
                                </Tag>
                                <Button onClick={onDiscard} disabled={isSaving}>
                                    Discard
                                </Button>
                            </>
                        )}
                        <Button
                            type="primary"
                            onClick={onSave}
                            loading={isSaving}
                            disabled={!isDirty}
                        >
                            Save changes
                        </Button>
                    </Flex>
                )}
            </Flex>
            {content}
        </Flex>
    );
};

export default GlobalPaymentSettings;
