import { useEffect, useState } from 'react';

import { DownOutlined, UserOutlined } from '@ant-design/icons';
import {
    Avatar,
    Badge,
    Divider,
    Dropdown,
    Flex,
    MenuProps,
    Popover,
    Typography,
    theme,
} from 'antd';
import { IoIosClose } from 'react-icons/io';
import { Link, useNavigate } from 'react-router-dom';

import NotificationIcon from '@assets/icons/Notification.svg';
import pekoConnect from '@assets/svg/pekoConnect.svg';
import ClaimPekoCreditsButton from '@components/molecular/claimPekoCreditsButton';
import SearchTree from '@components/molecular/searchTree/SearchTree';
import ServiceSearch from '@components/molecular/searchTree/ServiceSearch';
import UpgradePlanButton from '@components/molecular/upgradePlanButton';
import { UserRole } from '@customtypes/general';
import { getAvailableRoles } from '@domains/auth/api/index';
import useSwitchRole from '@domains/auth/hooks/useSwitchRole';
import { useCompanyNameFallback } from '@domains/dashboard/profile/hooks/useCompanyNameFallback';
import { createOwnerCardholderProfile } from '@src/domains/dashboard/corporateCards/api/user/switchRoleApi';
import OwnerCardholderProfileModal from '@src/domains/dashboard/corporateCards/components/landingPage/modals/OwnerCardholderProfileModal';
import { useActiveRole } from '@src/domains/dashboard/corporateCards/hooks/user/useActiveRole';
import { useAppSelector } from '@src/hooks/store';
import useNotificationApi from '@src/hooks/useNotificationApi';
import useShowWalletBalance from '@src/hooks/useShowWalletBalance';
import useSubUserLogout from '@src/hooks/useSubUserLogout';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';
import { handleLogout } from '@src/services/handleLogout';
import {
    getCardEmployeeDropdownItems,
    getCorporateDropdownItems,
    systemDropdownItems,
} from '@utils/navbarData';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import formatString from '@utils/wordFormat';

import NotificationsList from '../NotificationsList';

const { Text } = Typography;

const CustomHeader = () => {
    const { resetNotificationCount } = useNotificationApi();
    useUserInfo();
    useSubUserLogout();
    const navigate = useNavigate();
    const { user, notifications } = useAppSelector(state => state.reducer.user);
    const { roleName, role, sessionId, employeeName, autoLogin } = useAppSelector(
        state => state.reducer.auth
    );
    const freshChatDetails = useAppSelector(state => state.reducer.freshChat);
    const [open, setOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [hasEmployeeAccess, setHasEmployeeAccess] = useState(false);
    const [hasCorporateAccess, setHasCorporateAccess] = useState(false);
    const [hasSubCorporateAccess, setHasSubCorporateAccess] = useState(false);
    const { switchRole } = useSwitchRole();

    const email: string | undefined =
        roleName === 'corporate sub user' ? user?.subCorporateEmail : user?.email;
    const mobile: string | undefined =
        roleName === 'corporate sub user' ? user?.subCorporateMobile : user?.mobileNo;
    const credentialId: number | undefined =
        roleName === 'corporate sub user' ? user?.subCorporateCredential : user?.credentialId;

    // const restoreId: string | undefined = user?.chatId;
    const restoreId: string | undefined = freshChatDetails?.chatId;
    let userRole: string | undefined;
    let companyName: string | undefined;

    if (user) {
        userRole = user.role;
        // eslint-disable-next-line prefer-destructuring
        companyName = user.companyName;
    }

    const { applicationId, name: resolvedName } = useCompanyNameFallback();
    const isFreelancer = user?.accountType === 'freelancer';
    // An employee is a person, not a company: their own name is on the session, and the company-name
    // fallbacks below are never going to resolve for them.
    const displayName =
        role === UserRole.EMPLOYEE
            ? employeeName || 'Employee'
            : resolvedName || applicationId || 'Registration Pending';

    const accountLabel = (() => {
        if (role === UserRole.EMPLOYEE) return 'Employee';
        if (isFreelancer) return 'Freelancer / Influencer';
        return formatString(user?.roleName);
    })();

    const isSubCorporate = roleName === 'corporate sub user';
    const currentPlanName = user?.activeGroupPackageName || 'Free';
    const showUpgrade = !user?.isTopPlan;

    const isPekoCreditClaimPending = user?.isPekoCreditActive === false;
    const showPekoCredits = !isSubCorporate && !!user?.isPekoCreditAvailable;
    const showWalletBalance = useShowWalletBalance();

    const {
        token: { colorPrimary },
    } = theme.useToken();

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    // Asked for on EVERY identity that can hold another. It used to run only for a corporate session, so an
    // employee was never told they hold a corporate identity — and a sub-corporate was skipped outright,
    // which is the one session that can hold an employee identity alongside it.
    useEffect(() => {
        if (role !== UserRole.CORPORATE && role !== UserRole.EMPLOYEE) return;
        getAvailableRoles().then(roles => {
            setHasEmployeeAccess(roles.some(r => r.role === 'user'));
            setHasCorporateAccess(roles.some(r => r.role === 'corporate'));
            setHasSubCorporateAccess(roles.some(r => r.role === 'sub_corporate'));
        });
    }, [role]);

    // Driven only by the menu click below. The account menu is desktop only, so auto-opening would portal
    // this onto mobile screens that had no way to trigger it.
    const [profilePromptOpen, setProfilePromptOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);

    // Only an employee whose ASSIGNED card role is Admin gets a choice; `modes` is empty for everyone else,
    // so nothing is added. The account holder has a second identity for this, not a mode.
    const { modes, activeRole, isSwitching: isChangingMode, changeRole } = useActiveRole();

    const roleSwitchItems: MenuProps['items'] =
        modes.length > 1
            ? [
                  {
                      key: 'role-switch-group',
                      type: 'group',
                      label: 'Acting as',
                      children: modes.map(mode => ({
                          key: `switch-mode:${mode}`,
                          label: mode === activeRole ? `${mode} (current)` : mode,
                          disabled: isChangingMode || mode === activeRole,
                      })),
                  },
                  { type: 'divider', key: 'role-switch-divider' },
              ]
            : [];

    const baseAccountMenuItems = (() => {
        if (role === UserRole.CORPORATE) return getCorporateDropdownItems(hasEmployeeAccess, autoLogin);
        if (role === UserRole.EMPLOYEE)
            return getCardEmployeeDropdownItems(hasCorporateAccess, hasSubCorporateAccess);
        return systemDropdownItems;
    })();

    const accountMenuItems = [...(roleSwitchItems ?? []), ...(baseAccountMenuItems ?? [])];

    /**
     * The account holder's cardholder view is their own Employee account, so switching to it needs the
     * employee row that carries their card and KYC. The server builds it from what registration already
     * verified; only when it cannot does the UI ask, and it must ask BEFORE the switch, because switching
     * navigates away and a prompt shown after it is gone.
     */
    const goToEmployeeAccount = async () => {
        setIsSwitching(true);
        // Only the account HOLDER needs that row built on the way through. A sub-corporate reaches this menu
        // on the same session role, and is offered the switch precisely because their employee row already
        // exists — provisioning an owner profile for them would be the wrong identity entirely.
        if (isSubCorporate) {
            await switchRole('user');
            setIsSwitching(false);
            return;
        }
        const ensured = await createOwnerCardholderProfile();
        if (ensured && ensured.data?.needsDetails) {
            setIsSwitching(false);
            setProfilePromptOpen(true);
            return;
        }
        await switchRole('user');
        setIsSwitching(false);
    };

    const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
        if (key.startsWith('switch-mode:')) {
            await changeRole(key.slice('switch-mode:'.length));
        } else if (key === 'profile') {
            if (role === UserRole.CORPORATE) navigate(paths.dashboard.profile);
            else if (role === UserRole.EMPLOYEE) navigate(paths.employee.profile);
            else navigate(paths.systemUser.profile);
        } else if (key === 'employee-profile') {
            navigate(paths.employee.profile);
        } else if (key === 'settings') {
            navigate(paths.dashboard.settings);
        } else if (key === 'help') {
            navigate(paths.dashboard.needHelp);
        } else if (key === 'switch-employee') {
            await goToEmployeeAccount();
        } else if (key === 'switch-corporate') {
            await switchRole('corporate');
        } else if (key === 'switch-sub-corporate') {
            await switchRole('sub_corporate');
        } else if (key === 'logout') {
            if (!isLoggingOut) {
                setIsLoggingOut(true);
                await handleLogout().finally(() => {
                    setIsLoggingOut(false);
                });
            }
        }
    };
    useEffect(() => {
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.mobileNo, user?.email, user?.partnerId, user?.contactPersonName]);

    return (
        <>
            {/* PROTOTYPE-SETUP: FreshChat widget (ChatService loader) removed — marketing/support SDK. */}
            <Flex
                className="hidden w-full lg:flex justify-between gap-8 min-[1402px]:gap-3"
                align="center"
            >
                {role === UserRole.SYSTEM && (
                    <Flex align="center" className="w-4/12">
                        <SearchTree />
                    </Flex>
                )}
                <>
                    {role === UserRole.CORPORATE && (
                        <Flex align="center" className="xl:w-[30%] xxl:w-4/12 mySearchClass">
                            <Flex align="center" className="relative w-full mySearchClass">
                                <ServiceSearch classes="-mt-3" variant="borderless" />
                                <Flex justify="end" align="end">
                                    <Divider type="vertical" className="h-10 mx-0" />
                                </Flex>
                            </Flex>
                        </Flex>
                    )}
                </>
                <Flex justify="flex-end" align="center" className="gap-2 xxl:gap-4 w-full">
                    {role === UserRole.CORPORATE && !isSubCorporate && (
                        <>
                            <Flex align="center" gap={12} className="whitespace-nowrap">
                                <Link to={paths.dashboard.plans}>
                                    <Text className="text-sm cursor-pointer whitespace-nowrap">
                                        Current Plan:{' '}
                                        <span className="font-medium">{currentPlanName}</span>
                                    </Text>
                                </Link>
                                {showUpgrade && (
                                    <>
                                        <Divider type="vertical" className="flex-shrink-0 h-10" />
                                        <UpgradePlanButton />
                                    </>
                                )}
                            </Flex>
                            <Divider type="vertical" className="flex-shrink-0 h-10" />
                        </>
                    )}

                    {showWalletBalance && (
                        <>
                            <Link to={`/${paths.pekoWallet.index}`}>
                                <Flex
                                    vertical
                                    align="center"
                                    justify="center"
                                    className="whitespace-nowrap"
                                >
                                    <Text className="text-xs">Wallet</Text>
                                    <Text className="text-sm font-semibold">
                                        ₹ {formatNumberWithLocalString(user?.balance ?? 0)}
                                    </Text>
                                </Flex>
                            </Link>
                            <Divider type="vertical" className="h-10" />
                        </>
                    )}

                    {role === UserRole.CORPORATE && (
                        <>
                            {/* Peko Connect hidden until chat is wired up */}
                            <>
                                <Link
                                    className="hidden"
                                    to={`${paths.dashboard.moreServices}/${paths.pekoConnect.index}`}
                                >
                                    <Flex className="cursor-pointer">
                                        <Badge count={0} offset={[-5, 5]}>
                                            <Avatar
                                                size={32}
                                                shape="square"
                                                src={pekoConnect}
                                                className="cursor-pointer"
                                            />
                                        </Badge>
                                    </Flex>
                                </Link>
                                <Divider rootClassName="hidden" type="vertical" className="h-10" />
                            </>

                            <Popover
                                content={
                                    <div className="px-4">
                                        {NotificationsList()}
                                        <Flex className="w-full py-4" justify="end">
                                            {(notifications?.data?.length ?? 0) > 0 && (
                                                <Link to={paths.dashboard.notifications}>
                                                    <Text
                                                        className="text-sm"
                                                        style={{ color: colorPrimary }}
                                                        onClick={() => {
                                                            resetNotificationCount();
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        See More
                                                    </Text>
                                                </Link>
                                            )}
                                        </Flex>
                                    </div>
                                }
                                trigger="hover"
                                styles={{ body: { padding: 0, minWidth: 260 } }}
                                open={open}
                                title={() => (
                                    <Flex className="px-8 py-4 border-b" justify="space-between">
                                        <Text className="text-lg font-semibold">Notifications</Text>
                                        <IoIosClose
                                            className="text-2xl cursor-pointer text-black/45"
                                            onClick={() => setOpen(false)}
                                        />
                                    </Flex>
                                )}
                                placement="bottomRight"
                                onOpenChange={handleOpenChange}
                            >
                                <Badge count={notifications?.count || 0} offset={[-5, 5]}>
                                    <Avatar
                                        onClick={resetNotificationCount}
                                        shape="circle"
                                        src={NotificationIcon}
                                        className="cursor-pointer"
                                    />
                                </Badge>
                            </Popover>
                            <Divider type="vertical" className="h-10" />

                            {showPekoCredits && (
                                <>
                                    {isPekoCreditClaimPending ? (
                                        <ClaimPekoCreditsButton amount={user?.pekoCredits} />
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
                                                    ₹{' '}
                                                    {formatNumberWithLocalString(
                                                        user?.pekoCredits ?? 0
                                                    )}
                                                </Text>
                                            </Flex>
                                        </Link>
                                    )}
                                    <Divider type="vertical" className="h-10" />
                                </>
                            )}
                        </>
                    )}

                    <Dropdown
                        menu={{ items: accountMenuItems, onClick: handleMenuClick }}
                        trigger={['hover']}
                        placement="bottomRight"
                        overlayClassName="nav-user-dropdown"
                        overlayStyle={{ minWidth: '280px' }}
                    >
                        <Flex
                            gap={10}
                            align="center"
                            className="h-12 px-3 py-2 border cursor-pointer rounded-xl"
                        >
                            <Avatar
                                src={user?.logo}
                                size="large"
                                draggable={false}
                                className="bg-[#ffeeee]"
                            >
                                {resolvedName ? (
                                    <Text
                                        style={{ color: colorPrimary }}
                                        className="text-2xl font-bold"
                                    >
                                        {resolvedName.slice(0, 1).toUpperCase()}
                                    </Text>
                                ) : (
                                    <UserOutlined style={{ color: colorPrimary, fontSize: 20 }} />
                                )}
                            </Avatar>
                            <Flex vertical>
                                <Text className="text-xs font-semibold text-black myNavClass">
                                    {displayName}
                                </Text>
                                <Text className="text-xs text-gray-400 myNavClass">
                                    {accountLabel}
                                </Text>
                            </Flex>
                            <DownOutlined className="text-xs text-gray-500" />
                        </Flex>
                    </Dropdown>
                </Flex>
            </Flex>

            <OwnerCardholderProfileModal
                open={profilePromptOpen}
                isSubmitting={isSwitching}
                onCancel={() => setProfilePromptOpen(false)}
                onSubmit={async values => {
                    setIsSwitching(true);
                    const created = await createOwnerCardholderProfile(values);
                    setIsSwitching(false);
                    // Left open on refusal — the server's reason (a mobile already in use, an invalid name)
                    // is already toasted, and closing would discard what they typed.
                    if (!created || created.data?.needsDetails) return;
                    setProfilePromptOpen(false);
                    await switchRole('user');
                }}
            />
        </>
    );
};

export default CustomHeader;
