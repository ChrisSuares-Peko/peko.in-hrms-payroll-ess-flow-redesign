import { useMemo } from 'react';

import { ArrowLeftOutlined, DashboardOutlined } from '@ant-design/icons';
import { Flex, Image, Menu, MenuProps, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import Logo from '@assets/mainLogo/standard';
import { NavText } from '@components/molecular/nav-section/vertical/NavText';
import { paths } from '@src/routes/paths';

import { accountingLeafPath } from '../config/servicePaths';
import useAccountingNavData from '../hooks/useAccountingNavData';

type AccountingSidebarProps = {
    onNavigate?: () => void;
    collapsed?: boolean;
};

const AccountingSidebar = ({ onNavigate, collapsed = false }: AccountingSidebarProps) => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const groups = useAccountingNavData();

    const { items, selectedKey } = useMemo(() => {
        const tooltip = (label: string) => (collapsed ? label : undefined);
        const isDashboard = pathname === paths.systemUser.accounting;
        let active = isDashboard ? paths.systemUser.accounting : '';
        const menu: MenuProps['items'] = [
            {
                key: paths.systemUser.accounting,
                icon: <DashboardOutlined />,
                label: NavText('Dashboard', isDashboard),
                title: tooltip('Dashboard'),
            },
        ];
        groups.forEach(group => {
            menu.push({ type: 'divider', key: `divider-${group.category}` });
            group.items.forEach(item => {
                const key = accountingLeafPath(item.slug);
                const isActive = pathname === key || pathname.startsWith(`${key}/`);
                if (isActive) active = key;
                const shownLabel = item.displayLabel ?? item.label;
                menu.push({
                    key,
                    icon: item.icon,
                    label: NavText(shownLabel, isActive),
                    title: tooltip(shownLabel),
                });
            });
        });
        return { items: menu, selectedKey: active };
    }, [groups, pathname, collapsed]);

    const go = (key: string) => {
        navigate(key);
        onNavigate?.();
    };

    return (
        <Flex
            vertical
            className={`min-h-svh pb-4 bg-white border-r border-gray-200 border-solid ${collapsed ? 'items-center px-2' : 'px-1'}`}
        >
            {collapsed ? (
                <Flex
                    align="center"
                    justify="center"
                    className="my-5 w-12 shrink-0 cursor-pointer"
                    onClick={() => go(paths.systemUser.accounting)}
                >
                    <Image
                        src={Logo}
                        alt="logo"
                        preview={false}
                        width={48}
                        className="bg-transparent"
                    />
                </Flex>
            ) : (
                <Flex
                    align="center"
                    gap={10}
                    className="pt-4 pb-4 pl-6 cursor-pointer"
                    onClick={() => go(paths.systemUser.accounting)}
                >
                    <Image
                        src={Logo}
                        alt="logo"
                        preview={false}
                        width={100}
                        className="bg-transparent"
                    />
                    <span className="rounded-md bg-bgLightPink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-textLightRed">
                        Accounting
                    </span>
                </Flex>
            )}
            <Menu
                mode="inline"
                inlineCollapsed={collapsed}
                items={items}
                selectedKeys={selectedKey ? [selectedKey] : []}
                onClick={({ key }) => go(key)}
                className="border-none"
            />
            {!collapsed && groups.length === 0 && (
                <Typography.Text className="px-6 py-2 text-xs text-navTextColor">
                    No accounting services are enabled for your role.
                </Typography.Text>
            )}
            <Menu
                mode="inline"
                inlineCollapsed={collapsed}
                selectable={false}
                items={[
                    {
                        key: paths.systemUser.dashboard,
                        icon: <ArrowLeftOutlined />,
                        label: NavText('Back to Admin', false),
                        title: collapsed ? 'Back to Admin' : undefined,
                    },
                ]}
                onClick={({ key }) => go(key)}
                className="mt-auto border-none"
            />
        </Flex>
    );
};

export default AccountingSidebar;
