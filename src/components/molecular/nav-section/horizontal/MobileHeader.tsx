import React, { useEffect, useState } from 'react';

import { DownOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Flex, Grid, Image, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import NotificationIcon from '@assets/icons/Notification.svg';
import Support from '@assets/icons/Support.svg';
import Logo from '@assets/mainLogo/Logo.png';
import LogoutIcon from '@assets/svg/Logout.svg';
import pekoConnectMobile from '@assets/svg/pekoConnectMobile.svg';
import { UserRole } from '@customtypes/general';
import { getAvailableRoles } from '@domains/auth/api/index';
import useSwitchRole from '@domains/auth/hooks/useSwitchRole';
import { useCompanyNameFallback } from '@domains/dashboard/profile/hooks/useCompanyNameFallback';
import { useAppSelector } from '@src/hooks/store';
import useNotificationApi from '@src/hooks/useNotificationApi';
import useShowWalletBalance from '@src/hooks/useShowWalletBalance';
import { paths } from '@src/routes/paths';
import { handleLogout } from '@src/services/handleLogout';
import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Text } = Typography;
type MobileHeaderType = {
    handleDraggerOpen: () => void;
};
const MobileHeader = ({ handleDraggerOpen }: MobileHeaderType) => {
    const { user, notifications } = useAppSelector(state => state.reducer.user);
    const { roleName, role } = useAppSelector(state => state.reducer.auth);
    const { resetNotificationCount } = useNotificationApi();
    const showWalletBalance = useShowWalletBalance();
    const { applicationId, name: resolvedName } = useCompanyNameFallback();
    const displayName = resolvedName || applicationId || null;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [hasEmployeeAccess, setHasEmployeeAccess] = useState(false);
    const { switchRole } = useSwitchRole();

    const screens = Grid.useBreakpoint();

    // Mirrors the desktop account menu, compacted: the avatar is a dropdown rather than a link straight to
    // the profile page, so switching identity and signing out are reachable without opening a page first.
    useEffect(() => {
        if (role !== UserRole.CORPORATE) return;
        getAvailableRoles().then(roles => {
            setHasEmployeeAccess(roles.some(r => r.role === 'user'));
        });
    }, [role]);

    const navigate = useNavigate();
    const {
        token: { colorPrimary },
    } = theme.useToken();

    const profilePath =
        role === UserRole.CORPORATE ? paths.dashboard.profile : paths.systemUser.profile;

    const accountMenuItems: MenuProps['items'] = [
        ...(hasEmployeeAccess
            ? [{ key: 'switch-employee', label: 'Employee Account' }, { type: 'divider' as const }]
            : []),
        { key: 'profile', label: 'My Profile' },
        { type: 'divider' as const },
        { key: 'logout', label: 'Log out' },
    ];

    const accountAvatar = (
        <Avatar src={user?.logo} alt="profile" className="bg-[#ffeeee]" draggable={false}>
            {displayName ? (
                <Text style={{ color: colorPrimary }} className="text-2xl font-bold">
                    {displayName.slice(0, 1).toUpperCase()}
                </Text>
            ) : (
                <UserOutlined style={{ color: colorPrimary, fontSize: 18 }} />
            )}
        </Avatar>
    );

    const handleAccountMenuClick: MenuProps['onClick'] = async ({ key }) => {
        if (key === 'switch-employee') {
            await switchRole('user');
        } else if (key === 'profile') {
            navigate(profilePath);
        } else if (key === 'logout' && !isLoggingOut) {
            setIsLoggingOut(true);
            await handleLogout().finally(() => setIsLoggingOut(false));
        }
    };

    const handleNotificationClick = () => {
        resetNotificationCount();
        navigate(paths.dashboard.notifications);
    };
    return (
        <Flex align="center" justify="space-between" className="pl-4">
            <Flex align="center">
                {/* {isSubroute && (
                    <LeftOutlined
                        className="cursor-pointer"
                        onClick={() => navigate(-1)}
                        style={{ marginRight: '4px', fontSize: '18px' }}
                    />
                )} */}
                {(role === UserRole.CORPORATE || role === UserRole.SYSTEM) && (
                    <Button
                        type="text"
                        className="mt-3 sm:mt-2"
                        style={{ background: '#ffffff' }}
                        icon={<MenuOutlined style={{ fontSize: 20 }} />}
                        onClick={() => handleDraggerOpen()}
                    />
                )}
                <Image
                    src={Logo}
                    alt="logo"
                    className="bg-transparent cursor-pointer"
                    preview={false}
                    width={screens.xs ? 100 : 120}
                    onClick={() => navigate(paths.dashboard.home)}
                />
            </Flex>
            <Flex className="pr-5" gap={16} align="center">
                {role === UserRole.CORPORATE &&
                    roleName !== 'corporate sub user' &&
                    user?.isPekoCreditAvailable && (
                        <Flex className="hidden sm:flex">
                            {user?.isPekoCreditActive === false ? (
                                <Link to={paths.dashboard.pekoCredit}>
                                    <Flex className="w-20 p-2 text-xs border rounded-lg text-lightRed border-lightRed bg-iconBgRed">
                                        Claim your free credits
                                    </Flex>
                                </Link>
                            ) : (
                                <Link to={paths.dashboard.pekoCredit}>
                                    <Flex
                                        vertical
                                        align="center"
                                        justify="center"
                                        className="whitespace-nowrap"
                                    >
                                        <Text className="text-xs">Peko Credits</Text>
                                        <Text className="text-sm font-semibold">
                                            {`₹ ${formatNumberWithLocalString(user?.pekoCredits ?? 0)}`}
                                        </Text>
                                    </Flex>
                                </Link>
                            )}
                        </Flex>
                    )}
                {showWalletBalance && (
                    <Flex className="hidden sm:flex">
                        <Link to={`/${paths.pekoWallet.index}`}>
                            <Flex
                                vertical
                                align="center"
                                justify="center"
                                className="whitespace-nowrap"
                            >
                                <Text className="text-xs">Wallet</Text>
                                <Text className="text-sm font-semibold">
                                    {`₹ ${formatNumberWithLocalString(user?.balance ?? 0)}`}
                                </Text>
                            </Flex>
                        </Link>
                    </Flex>
                )}
                <Avatar
                    alt="Support icon"
                    size={28}
                    shape="square"
                    src={Support}
                    className={`cursor-pointer ${role === UserRole.SYSTEM ? 'hidden' : ''}`}
                    onClick={() => navigate(paths.dashboard.needHelp)}
                />
                {user?.roleName === 'corporate' ? (
                    <Link
                        className="hidden"
                        to={`${paths.dashboard.moreServices}/${paths.pekoConnect.index}`}
                    >
                        <Flex className="cursor-pointer">
                            <Badge size="small" count={0} offset={[-5, 5]}>
                                <Avatar
                                    alt="pekoConnect"
                                    size={28}
                                    shape="square"
                                    src={pekoConnectMobile}
                                    className="cursor-pointer "
                                />
                            </Badge>
                        </Flex>
                    </Link>
                ) : (
                    ''
                )}
                <Badge size="small" count={notifications?.count || 0} offset={[-10, 10]}>
                    <Avatar
                        shape="circle"
                        src={NotificationIcon}
                        className={`cursor-pointer ${role === UserRole.SYSTEM ? 'hidden' : ''}`}
                        onClick={() => handleNotificationClick()}
                    />
                </Badge>
                {role === UserRole.CORPORATE ? (
                    <Dropdown
                        menu={{ items: accountMenuItems, onClick: handleAccountMenuClick }}
                        trigger={['click']}
                        placement="bottomRight"
                        overlayClassName="nav-user-dropdown"
                        overlayStyle={{ minWidth: '160px' }}
                    >
                        <Flex gap={4} align="center" className="cursor-pointer">
                            {accountAvatar}
                            <DownOutlined className="text-xs text-gray-500" />
                        </Flex>
                    </Dropdown>
                ) : (
                    <Flex className="cursor-pointer" onClick={() => navigate(profilePath)}>
                        {accountAvatar}
                    </Flex>
                )}
                {role === UserRole.SYSTEM && (
                    <Image
                        alt="LogoutIcon"
                        src={LogoutIcon}
                        preview={false}
                        onClick={async () => {
                            if (!isLoggingOut) {
                                setIsLoggingOut(true);
                                await handleLogout().finally(() => {
                                    setIsLoggingOut(false);
                                });
                            }
                        }}
                        className="pl-4 cursor-pointer"
                    />
                )}
            </Flex>
        </Flex>
    );
};

export default MobileHeader;
