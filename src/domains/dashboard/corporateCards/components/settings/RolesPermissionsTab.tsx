import { CheckCircleFilled, MinusOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Flex, Row, Space, Spin, Tag, Typography } from 'antd';

import { useRoleCatalogue } from '../../hooks/admin/useRoleCatalogue';
import { cn } from '../../utils/cn';

const { Text, Title } = Typography;

/** Read-only indicator. Roles are fixed presets, so a Switch would imply an edit that is not possible. */
const PermissionState = ({ enabled }: { enabled: boolean }) =>
    enabled ? (
        <CheckCircleFilled
            className="shrink-0 text-base !text-savingsTagLightText"
            aria-label="Allowed"
        />
    ) : (
        <MinusOutlined
            className="shrink-0 text-base !text-textGreyLight"
            aria-label="Not allowed"
        />
    );

const RolesPermissionsTab = () => {
    const { roles, activeRoleName, setActiveRoleName, activeRole, isLoading } = useRoleCatalogue();

    const permissions = activeRole?.permissions ?? null;
    const hasPermissions = !!permissions?.services?.some(service =>
        service.categories?.some(category => category.permissions?.length)
    );

    return (
        <Row gutter={[24, 24]} align="top">
            <Col xs={24} lg={8}>
                <Card className="rounded-2xl border-borderCard" styles={{ body: { padding: 24 } }}>
                    <Title level={5} className="!mb-5 !text-textHeadings">
                        Roles
                    </Title>

                    {isLoading && (
                        <Flex justify="center" className="py-8">
                            <Spin />
                        </Flex>
                    )}
                    {!isLoading && roles.length === 0 && (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text className="text-sm text-textBody">
                                    Roles could not be loaded. Please try again.
                                </Text>
                            }
                        />
                    )}
                    {!isLoading && roles.length > 0 && (
                        <Space direction="vertical" size={12} className="w-full">
                            {roles.map(role => {
                                const isActive = activeRoleName === role.roleName;
                                return (
                                    <button
                                        key={role.roleName}
                                        type="button"
                                        onClick={() => setActiveRoleName(role.roleName)}
                                        className={cn(
                                            'w-full rounded-2xl px-4 py-3 text-left',
                                            isActive
                                                ? 'border border-bgLightPink bg-bgLightPink'
                                                : ''
                                        )}
                                    >
                                        <Flex justify="space-between" align="center" gap={8}>
                                            <Text
                                                className={cn(
                                                    'min-w-0 truncate text-sm font-bold',
                                                    isActive
                                                        ? '!text-textLightRed'
                                                        : '!text-textHeadings'
                                                )}
                                            >
                                                {role.roleName}
                                            </Text>
                                            <Text
                                                className={cn(
                                                    'shrink-0 text-xs',
                                                    isActive
                                                        ? '!text-textLightRed'
                                                        : '!text-textGreyLight'
                                                )}
                                            >
                                                {role.permissionCount}{' '}
                                                {role.permissionCount === 1
                                                    ? 'permission'
                                                    : 'permissions'}
                                            </Text>
                                        </Flex>
                                        {role.isDefault && (
                                            <Tag
                                                bordered={false}
                                                className="m-0 mt-2 rounded-full bg-listBg px-2 py-0.5 text-xs !text-textBody"
                                            >
                                                Default for new members
                                            </Tag>
                                        )}
                                    </button>
                                );
                            })}
                        </Space>
                    )}
                </Card>
            </Col>

            <Col xs={24} lg={16}>
                <Card className="rounded-2xl border-borderCard" styles={{ body: { padding: 24 } }}>
                    <div className="mb-6">
                        <Title level={5} className="!mb-1 !text-textHeadings">
                            {activeRole ? activeRole.roleName : 'Permissions'}
                        </Title>
                        <Text className="text-sm text-textBody">
                            {activeRole?.description ??
                                'Select a role to see what members with it can do.'}
                        </Text>
                    </div>

                    {isLoading && (
                        <Flex justify="center" className="py-10">
                            <Spin />
                        </Flex>
                    )}
                    {!isLoading && (!permissions || !hasPermissions) && (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text className="text-sm text-textBody">
                                    Permissions could not be loaded. Please try again.
                                </Text>
                            }
                        />
                    )}
                    {!isLoading && permissions && hasPermissions && (
                        <Space direction="vertical" size={24} className="w-full">
                            {permissions.services.map(service => (
                                <Space
                                    key={service.accessKey}
                                    direction="vertical"
                                    size={24}
                                    className="w-full"
                                >
                                    {permissions.services.length > 1 && (
                                        <Title level={5} className="!mb-0 !text-textHeadings">
                                            {service.service}
                                        </Title>
                                    )}
                                    {service.categories.map(group => (
                                        <Space
                                            key={`${service.accessKey}-${group.category}`}
                                            direction="vertical"
                                            size={8}
                                            className="w-full"
                                        >
                                            <Text className="block text-xs font-semibold uppercase tracking-wide text-textGreyLight">
                                                {group.category}
                                            </Text>
                                            <Space direction="vertical" size={8} className="w-full">
                                                {group.permissions.map(item => (
                                                    <Card
                                                        key={item.key}
                                                        className="rounded-xl border-borderCard"
                                                        styles={{ body: { padding: '12px 16px' } }}
                                                    >
                                                        <Flex
                                                            justify="space-between"
                                                            align="center"
                                                            gap={12}
                                                        >
                                                            <Text
                                                                className={cn(
                                                                    'min-w-0 break-words text-sm',
                                                                    item.enabled
                                                                        ? 'text-textBody'
                                                                        : 'text-textGreyLight'
                                                                )}
                                                            >
                                                                {item.label}
                                                            </Text>
                                                            <PermissionState
                                                                enabled={item.enabled}
                                                            />
                                                        </Flex>
                                                    </Card>
                                                ))}
                                            </Space>
                                        </Space>
                                    ))}
                                </Space>
                            ))}
                        </Space>
                    )}
                </Card>
            </Col>
        </Row>
    );
};

export default RolesPermissionsTab;
