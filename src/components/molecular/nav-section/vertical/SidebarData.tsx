import { useCallback, useMemo, useRef } from 'react';

import { Divider } from 'antd';
import { useLocation } from 'react-router-dom';

import AccountIcon from '@assets/icons/Accounts.svg';
import AnnouncementIcon from '@assets/icons/Announcements.svg';
// import ConnectIcon from '@assets/icons/Connect.svg';
import CorporateCardIcon from '@assets/icons/CorporateCard.svg';
import DashboardIcon from '@assets/icons/Dashboard.svg';
import NeddHelpIcon from '@assets/icons/Help.svg';
// import InsuranceIcon from '@assets/icons/Insurance.svg';
import ManageIcon from '@assets/icons/Manage.svg';
// import PaymentLinkIcon from '@assets/icons/PaymentLink.svg';
import PayrollIcon from '@assets/icons/Payroll.svg';
// import PekoCloudIcon from '@assets/icons/pekocloud.svg';
import ReportsIcon from '@assets/icons/Reports.svg';
import SettingIcon from '@assets/icons/Settings.svg';
// import SubscriptionsIcon from '@assets/icons/Subscriptions.svg';
import SuppliesIcon from '@assets/icons/Supplies.svg';
import { UserRole } from '@customtypes/general';
import {
    CARD_SERVICE_LABEL,
    cardsVisibleToEmployee,
    holdsCardMembership,
    holdsPayrollMembership,
    isCardServiceLabel,
    EMPLOYEE_MODE_SERVICE_LABELS,
} from '@src/domains/dashboard/corporateCards/utils/activeRole';
// import { ComingSoon } from '@src/domains/dashboard/MoreServices/utils/data';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { checkRole, checkSidebarkAccess } from '@utils/checkAccess';
import { toServiceRoute } from '@utils/serviceRoute';

import { NavIcon } from './NavIcon';
import { NavText } from './NavText';

interface NavItem {
    key: string;
    label: React.ReactNode | string;
    icon?: React.ReactNode;
    stringLabel?: string;
    alwaysShow?: boolean;
}

/**
 * Services an EMPLOYEE reaches through their own portal rather than the corporate module.
 *
 * Payroll's employee-facing side is the ESS portal — payslips, attendance, leaves — not the corporate payroll
 * module the services tree routes to, which an employee has no business in. The tree emits an entry for every
 * service their grant covers, so without this the label appears twice for anyone invited to both, one of them
 * pointing at the wrong place.
 *
 * Keyed by the label the services tree uses. A second such service is one more entry here.
 */
const EMPLOYEE_PORTAL_SERVICE_LABELS = new Set(['payroll']);

const TRAILING_GROUP = ['Reports', 'Need Help', 'Settings'];

/** Routes inside the employee shell that belong to a service other than Payroll. */
const EMPLOYEE_SHELL_NON_PAYROLL_ROUTES = [paths.employee.corporateCard];

export function useNavData() {
    const location = useLocation();
    const { role, employeeProfileId, serviceMemberships } =
        useAppSelector(state => state.reducer.auth);
    const { cardKybComplete } = useAppSelector(state => state.reducer.corporateCards);
    // The Employee account is its own identity, so a corporate session is never restricted to it.
    const employeeModeOnly = false;
    // Subscribe to the services slice so the sidebar re-renders when /user/info
    // responds. checkCorporateSidebar/checkMoreServicesSidebar read from store.getState()
    // (non-reactive), so without this selector the sidebar would freeze at whatever
    // services were in Redux at first mount — e.g. empty after a full app re-init
    // (browser back from Cashfree, hard refresh) — and only "More Services" would
    // survive the access filter.
    useAppSelector(state => state.reducer.services.services?.data);
    const navData = useRef<NavItem[]>();
    const { services } = useAppSelector(state => state.reducer.services);

    const checkRouteIsActive = useCallback(
        (route: string) => {
            const pathArray = location.pathname.split('/').filter(Boolean);
            const firstRoute = pathArray.length > 0 ? `/${pathArray[0]}` : '/';
            return firstRoute === route;
        },
        [location.pathname]
    );

    // const sidebarConfig: NavItem[] = useMemo(
    //     () => [
    //         {
    //             key: paths.dashboard.home,
    //             label: NavText('Dashboard', checkRouteIsActive(paths.dashboard.home)),
    //             icon: NavIcon(DashboardIcon, checkRouteIsActive(paths.dashboard.home)),
    //             stringLabel: 'Dashboard',
    //         },
    //         {
    //             key: paths.dashboard.mobileRecharge,
    //             stringLabel: serviceCategoryNames.telecom,
    //             icon: NavIcon(
    //                 MobileRechargeIcon,
    //                 location.pathname.includes(paths.dashboard.mobileRecharge)
    //             ),
    //             label: NavText(
    //                 serviceCategoryNames.telecom,
    //                 location.pathname.includes(paths.dashboard.mobileRecharge)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.billPayments,
    //             stringLabel: serviceCategoryNames.utility,
    //             icon: NavIcon(
    //                 BillPaymentsIcon,
    //                 location.pathname.includes(paths.dashboard.billPayments)
    //             ),
    //             label: NavText(
    //                 serviceCategoryNames.utility,
    //                 location.pathname.includes(paths.dashboard.billPayments)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.corporateTravel,
    //             stringLabel: 'Corporate Travel',
    //             icon: NavIcon(
    //                 TravelIcon,
    //                 location.pathname.includes(paths.dashboard.corporateTravel),
    //                 true
    //             ),
    //             label: NavText(
    //                 'Corporate Travel',
    //                 location.pathname.includes(paths.dashboard.corporateTravel)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.payroll,
    //             stringLabel: 'Payroll',
    //             icon: NavIcon(PayrollIcon, location.pathname.includes(paths.dashboard.payroll)),
    //             label: NavText('Payroll', location.pathname.includes(paths.dashboard.payroll)),
    //         },
    //         {
    //             key: paths.dashboard.invoicing,
    //             stringLabel: 'Invoicing',
    //             icon: NavIcon(InvoicingIcon, location.pathname.includes(paths.dashboard.invoicing)),
    //             label: NavText('Invoicing', location.pathname.includes(paths.dashboard.invoicing)),
    //         },
    //         {
    //             key: paths.dashboard.giftCards,
    //             stringLabel: 'Gift Cards',
    //             icon: NavIcon(GiftCardsIcon, location.pathname.includes(paths.dashboard.giftCards)),
    //             label: NavText('Gift Cards', location.pathname.includes(paths.dashboard.giftCards)),
    //         },
    //         {
    //             key: paths.dashboard.payout,
    //             stringLabel: 'Payouts',
    //             icon: NavIcon(
    //                 VendorPayoutsIcon,
    //                 location.pathname.includes(paths.dashboard.payout)
    //             ),
    //             label: NavText('Payouts', location.pathname.includes(paths.dashboard.payout)),
    //         },
    //         {
    //             key: paths.dashboard.paymentLinks,
    //             stringLabel: 'Payment Links',
    //             icon: NavIcon(
    //                 PaymentLinkIcon,
    //                 location.pathname.includes(paths.dashboard.paymentLinks)
    //             ),
    //             label: NavText(
    //                 'Payment Links',
    //                 location.pathname.includes(paths.dashboard.paymentLinks)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.procure,
    //             stringLabel: 'Procure',

    //             icon: NavIcon(
    //                 ProcureIcon,
    //                 location.pathname.includes(paths.dashboard.procure),
    //                 true
    //             ),
    //             label: NavText('Procure', location.pathname.includes(paths.dashboard.procure)),
    //         },
    //         {
    //             key: paths.dashboard.accounting,
    //             stringLabel: 'Accounting',
    //             icon: NavIcon(TaxIcon, location.pathname.includes(paths.dashboard.accounting)),
    //             label: NavText(
    //                 'Accounting',
    //                 location.pathname.includes(paths.dashboard.accounting)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.verificationSuite,
    //             stringLabel: 'Verification Suite',
    //             icon: NavIcon(
    //                 verification,
    //                 location.pathname.includes(paths.dashboard.verificationSuite),
    //                 true
    //             ),
    //             label: NavText(
    //                 'Verification Suite',
    //                 location.pathname.includes(paths.dashboard.verificationSuite)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.taxMore,
    //             stringLabel: 'Tax & More',
    //             icon: NavIcon(TaxIcon, location.pathname.includes(paths.dashboard.taxMore)),
    //             label: NavText('Tax & More', location.pathname.includes(paths.dashboard.taxMore)),
    //         },
    //         {
    //             key: paths.dashboard.logistics,
    //             stringLabel: 'Logistics',
    //             icon: NavIcon(LogisticsIcon, location.pathname.includes(paths.dashboard.logistics)),
    //             label: NavText('Logistics', location.pathname.includes(paths.dashboard.logistics)),
    //         },
    //         {
    //             key: paths.dashboard.turbo,
    //             stringLabel: 'Turbo',
    //             icon: NavIcon(TurboIcon, location.pathname.includes(paths.dashboard.turbo), true),
    //             label: NavText('Turbo', location.pathname.includes(paths.dashboard.turbo)),
    //         },
    //         {
    //             key: paths.dashboard.whatsappForBusiness,
    //             stringLabel: 'WhatsApp for Business',
    //             icon: NavIcon(
    //                 WhatsappIcon,
    //                 location.pathname.includes(paths.dashboard.whatsappForBusiness)
    //             ),
    //             label: NavText(
    //                 'WhatsApp for Business',
    //                 location.pathname.includes(paths.dashboard.whatsappForBusiness)
    //             ),
    //         },
    //         {
    //             key: paths.dashboard.eSign,
    //             stringLabel: 'eSign',
    //             icon: NavIcon(EsignIcon, location.pathname.includes(paths.dashboard.eSign), true),
    //             label: NavText('eSign', location.pathname.includes(paths.dashboard.eSign)),
    //         },
    //         {
    //             key: paths.dashboard.sales,
    //             label: NavText('SalesX', checkRouteIsActive(paths.dashboard.sales)),
    //             icon: NavIcon(SalesIcon, checkRouteIsActive(paths.dashboard.sales), true),
    //             stringLabel: 'Sales',
    //         },
    //         {
    //             key: paths.dashboard.moreServices,
    //             stringLabel: 'More Services',
    //             icon: NavIcon(
    //                 MoreServicesIcon,
    //                 location.pathname.includes(paths.dashboard.moreServices)
    //             ),
    //             label: NavText(
    //                 'More Services',
    //                 location.pathname.includes(paths.dashboard.moreServices)
    //             ),
    //         },
    //         // {
    //         //     key: paths.dashboard.subscriptions,
    //         //     stringLabel: 'Softwares',
    //         //     icon: NavIcon(SubscriptionsIcon, location.pathname.includes(paths.dashboard.subscriptions)),
    //         //     label: NavText('Softwares', location.pathname.includes(paths.dashboard.subscriptions)),
    //         // },
    //         // {
    //         //     key: paths.dashboard.vendorPayouts,
    //         //     stringLabel: 'Vendor Payouts',
    //         //     icon: NavIcon(
    //         //         VendorPayoutsIcon,
    //         //         location.pathname.includes(paths.dashboard.vendorPayouts)
    //         //     ),
    //         //     label: NavText(
    //         //         'Vendor Payouts',
    //         //         location.pathname.includes(paths.dashboard.vendorPayouts)
    //         //     ),
    //         // },
    //         // {
    //         //     key: paths.dashboard.officeSupplies,
    //         //     stringLabel: 'Office Supplies',
    //         //     icon: NavIcon(
    //         //         SuppliesIcon,
    //         //         location.pathname.includes(paths.dashboard.officeSupplies)
    //         //     ),
    //         //     label: NavText(
    //         //         'Office Supplies',
    //         //         location.pathname.includes(paths.dashboard.officeSupplies)
    //         //     ),
    //         // },
    //         // {
    //         //     key: paths.dashboard.tax,
    //         //     stringLabel: 'Accounting & Tax',
    //         //     icon: NavIcon(TaxIcon, location.pathname.includes(paths.dashboard.tax)),
    //         //     label: NavText('Accounting & Tax', location.pathname.includes(paths.dashboard.tax)),
    //         // },
    //         // {
    //         //     key: paths.dashboard.insurance,
    //         //     stringLabel: 'Insurance',
    //         //     icon: NavIcon(InsuranceIcon, location.pathname.includes(paths.dashboard.insurance)),
    //         //     label: NavText('Insurance', location.pathname.includes(paths.dashboard.insurance)),
    //         // },
    //         // {
    //         //     key: paths.dashboard.pekoCloud,
    //         //     label: NavText('Hub', location.pathname.includes(paths.dashboard.pekoCloud)),
    //         //     icon: NavIcon(PekoCloudIcon, location.pathname.includes(paths.dashboard.pekoCloud)),
    //         //     stringLabel: 'Hub',
    //         // },
    //         // {
    //         //     key: paths.dashboard.corporateCard,
    //         //     stringLabel: 'Corporate Card',
    //         //     icon: NavIcon(
    //         //         CorporateCardIcon,
    //         //         location.pathname.includes(paths.dashboard.corporateCard),
    //         //         true
    //         //     ),
    //         //     label: NavText(
    //         //         'Corporate Card',
    //         //         location.pathname.includes(paths.dashboard.corporateCard)
    //         //     ),
    //         // },
    //         { key: '', label: <Divider /> },
    //         {
    //             key: paths.dashboard.reports,
    //             stringLabel: 'Reports',
    //             icon: NavIcon(ReportsIcon, location.pathname.includes(paths.dashboard.reports)),
    //             label: NavText('Reports', location.pathname.includes(paths.dashboard.reports)),
    //         },
    //         {
    //             key: paths.dashboard.needHelp,
    //             stringLabel: 'Need Help',
    //             icon: NavIcon(NeddHelpIcon, location.pathname.includes(paths.dashboard.needHelp)),
    //             label: NavText('Need Help?', location.pathname.includes(paths.dashboard.needHelp)),
    //         },
    //         // {
    //         //     key: paths.dashboard.settings,
    //         //     label: NavText('Settings', checkRouteIsActive(paths.dashboard.settings)),
    //         //     icon: NavIcon(SettingIcon, checkRouteIsActive(paths.dashboard.settings)),
    //         //     stringLabel: 'Settings',
    //         // },
    //     ],
    //     [checkRouteIsActive, location.pathname]
    // );

    const adminSidebarConfig: NavItem[] = useMemo(
        () => [
            {
                key: checkRole('dashboard'),
                label: NavText('Dashboard', location.pathname.includes(checkRole('dashboard'))),
                icon: NavIcon(DashboardIcon, location.pathname.includes(checkRole('dashboard'))),
                stringLabel: 'Dashboard',
            },
            {
                key: checkRole('accounts'),
                label: NavText('Accounts', location.pathname.includes(checkRole('accounts'))),
                icon: NavIcon(AccountIcon, location.pathname.includes(checkRole('accounts'))),
                stringLabel: 'Accounts',
            },
            {
                key: checkRole('users'),
                label: NavText('Users', location.pathname.includes(checkRole('users'))),
                icon: NavIcon(AccountIcon, location.pathname.includes(checkRole('users'))),
                stringLabel: 'Users',
            },
            {
                key: checkRole('announcement'),
                label: NavText(
                    'Announcements',
                    location.pathname.includes(checkRole('announcement'))
                ),
                icon: NavIcon(
                    AnnouncementIcon,
                    location.pathname.includes(checkRole('announcement'))
                ),
                stringLabel: 'Announcements',
            },
            {
                key: checkRole('officeSupplies'),
                label: NavText(
                    'Office Supplies',
                    location.pathname.includes(checkRole('officeSupplies'))
                ),
                icon: NavIcon(
                    SuppliesIcon,
                    location.pathname.includes(checkRole('officeSupplies'))
                ),
                stringLabel: 'Office Supplies',
            },

            {
                key: checkRole('reports'),
                label: NavText('Reports', location.pathname.includes(checkRole('reports'))),
                icon: NavIcon(ReportsIcon, location.pathname.includes(checkRole('reports'))),
                stringLabel: 'Reports',
            },
            {
                key: checkRole('payrollConfig'),
                label: NavText('Payroll', location.pathname.includes(checkRole('payrollConfig'))),
                icon: NavIcon(PayrollIcon, location.pathname.includes(checkRole('payrollConfig'))),
                stringLabel: 'Payroll',
            },

            {
                key: checkRole('manage'),
                label: NavText('Manage', location.pathname.includes(checkRole('manage'))),
                icon: NavIcon(ManageIcon, location.pathname.includes(checkRole('manage'))),
                stringLabel: 'Manage',
            },
            {
                key: `${checkRole('manage')}/compliance`,
                label: NavText(
                    'Compliance',
                    location.pathname.includes(`${checkRole('manage')}/compliance`)
                ),
                icon: NavIcon(
                    ManageIcon,
                    location.pathname.includes(`${checkRole('manage')}/compliance`)
                ),
                stringLabel: 'Compliance',
            },
            {
                key: checkRole('systemConfiguration'),
                label: NavText(
                    'System Configuration',
                    location.pathname.includes(checkRole('systemConfiguration'))
                ),
                icon: NavIcon(
                    SettingIcon,
                    location.pathname.includes(checkRole('systemConfiguration'))
                ),
                stringLabel: 'System Configuration',
            },

            {
                key: checkRole('settings'),
                label: NavText('Settings', location.pathname.includes(checkRole('settings'))),
                icon: NavIcon(SettingIcon, location.pathname.includes(checkRole('settings'))),
                stringLabel: 'Settings',
            },

            {
                key: checkRole('needHelp'),
                label: NavText('Need Help', location.pathname.includes(checkRole('needHelp'))),
                icon: NavIcon(NeddHelpIcon, location.pathname.includes(checkRole('needHelp'))),
                stringLabel: 'Need Help',
            },
            {
                key: paths.systemUser.accounting,
                label: NavText(
                    'Accounting',
                    location.pathname.includes(paths.systemUser.accounting),
                    'portal'
                ),
                icon: NavIcon(ManageIcon, location.pathname.includes(paths.systemUser.accounting)),
                stringLabel: 'Accounting',
            },
        ],
        [location.pathname]
    );

    // ESS employees only ever have one destination — the Payroll self-service portal —
    // so this is a single static item rather than a filtered corporate/admin config.
    // Payroll owns the employee portal's root, so every route under it lights Payroll up — including the
    // ones belonging to another service mounted in the same shell. Each of those has to be excluded, or
    // two sidebar entries read as selected at once.
    const employeeSidebarConfig: NavItem[] = useMemo(() => {
        const isPayrollActive =
            location.pathname.startsWith(paths.employee.home) &&
            !EMPLOYEE_SHELL_NON_PAYROLL_ROUTES.some(route => location.pathname.startsWith(route));

        return [
            {
                key: paths.employee.home,
                stringLabel: 'Payroll',
                icon: NavIcon(PayrollIcon, isPayrollActive),
                label: NavText('Payroll', isPayrollActive),
            },
        ];
    }, [location.pathname]);

    const generateEmployeeData = useCallback(() => {
        navData.current = employeeSidebarConfig.map(item => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
        }));
    }, [employeeSidebarConfig]);

    const generateCorporateData = useCallback(() => {
        const servicesData = services?.data ?? [];

        // Defensive de-dupe: the API has occasionally sent the same service twice
        // (e.g. "Global Business Setup" showing up twice in the sidebar) — key on a
        // normalized label, keeping the first occurrence.
        const seenServiceKeys = new Set<string>();
        const dedupedServicesData = servicesData.filter(service => {
            const dedupeKey = service.label?.trim().toLowerCase();
            if (!dedupeKey || seenServiceKeys.has(dedupeKey)) return false;
            seenServiceKeys.add(dedupeKey);
            return true;
        });

        const visibleServicesData = employeeModeOnly
            ? dedupedServicesData.filter(service =>
                  EMPLOYEE_MODE_SERVICE_LABELS.has(service.label?.trim().toLowerCase() ?? '')
              )
            : dedupedServicesData;

        // Main sidebar items come entirely from redux: every accessible service that
        // is NOT flagged `enableMoreService` (those are surfaced on the More Services page).
        // Route is derived from label + enableMoreService via the shared toServiceRoute().
        const items: NavItem[] = visibleServicesData
            .filter(service => service.hasAccess && !service.enableMoreService)
            .map(service => {
                const route = toServiceRoute(service.label, service.enableMoreService);
                const isActive = checkRouteIsActive(route);
                return {
                    key: route,
                    label: NavText(service.alias || service.label, isActive),
                    icon: NavIcon(service.icon, isActive),
                    stringLabel: service.label,
                };
            });

        // Interim: Corporate Cards has no backend accessKey yet (see CorporateAccessGuard's
        // whitelist), so it never comes through `services.data` like the rest of this list.
        // Show it unconditionally until the backend ships the accessKey + entitlement, then
        // remove this block — it'll start flowing through the filter/map above on its own.
        // items.push({
        //     key: paths.dashboard.corporateCard,
        //     label: NavText(
        //         'Corporate Cards',
        //         checkRouteIsActive(paths.dashboard.corporateCard)
        //     ),
        //     icon: NavIcon(CorporateCardIcon, checkRouteIsActive(paths.dashboard.corporateCard)),
        //     stringLabel: 'Corporate Cards',
        // });

        // Group the trailing utility items (Reports / Need Help / Settings) under a
        // divider, matching the design.
        const dividerIndex = items.findIndex(item =>
            TRAILING_GROUP.includes(item.stringLabel ?? '')
        );
        if (dividerIndex > 0) {
            items.splice(dividerIndex, 0, { key: '', label: <Divider className="my-1" /> });
        }

        // "More Services" container entry — shown only when at least one accessible
        // service is flagged `enableMoreService`.
        // const hasMoreServiceItems = servicesData.some(
        //     service => service.enableMoreService && service.hasAccess
        // );
        // if (hasMoreServiceItems) {
        //     items.push({
        //         key: paths.dashboard.moreServices,
        //         label: NavText('More Services', checkRouteIsActive(paths.dashboard.moreServices)),
        //         icon: NavIcon(MoreServicesIcon, checkRouteIsActive(paths.dashboard.moreServices)),
        //         stringLabel: 'More Services',
        //     });
        // }

        navData.current = items;
    }, [services, checkRouteIsActive, employeeModeOnly]);

    // Built here rather than taken from the services tree: a non-member employee is admitted on the
    // kyb-state answer so the tree carries no card entry for them at all, and the entry the tree DOES carry
    // for a member points at the corporate shell's route, which the caller strips first. Placed ahead of the
    // trailing utility group rather than after it.
    const withCorporateCards = useCallback(
        (items: NavItem[]): NavItem[] => {
            const route = paths.employee.corporateCard;
            const isActive = location.pathname.startsWith(route);
            const entry: NavItem = {
                key: route,
                label: NavText(CARD_SERVICE_LABEL, isActive),
                icon: NavIcon(CorporateCardIcon, isActive),
                stringLabel: CARD_SERVICE_LABEL,
            };

            const trailingAt = items.findIndex(
                item => item.key === '' || TRAILING_GROUP.includes(item.stringLabel ?? '')
            );
            return trailingAt < 0
                ? [...items, entry]
                : [...items.slice(0, trailingAt), entry, ...items.slice(trailingAt)];
        },
        [location.pathname]
    );

    const generateSystemData = useCallback(() => {
        const items = adminSidebarConfig
            .filter(item => checkSidebarkAccess(item.stringLabel!) || item.key === '')
            .map(item => ({
                key: item.key,
                label: item.label,
                icon: item.icon,
            }));

        navData.current = items;
    }, [adminSidebarConfig]);

    if (role === UserRole.CORPORATE) {
        generateCorporateData();
    } else if (role === UserRole.SYSTEM) {
        generateSystemData();
    } else if (
        holdsCardMembership(role, employeeProfileId, serviceMemberships) ||
        cardsVisibleToEmployee(role, cardKybComplete)
    ) {
        // What they hold, and only what they hold. The rest comes from their own services grant, so a
        // cards-only invite shows Corporate Cards alone and a later Payroll invite adds Payroll to it.
        generateCorporateData();

        // ...minus anything they reach through their own portal instead. Once someone holds both invites the
        // services tree emits its own "Payroll" too, so the label rendered twice — and the tree's one points
        // at the corporate payroll module rather than the employee's ESS portal.
        const portalOrCardLabel = (item: NavItem) =>
            EMPLOYEE_PORTAL_SERVICE_LABELS.has(item.stringLabel?.trim().toLowerCase() ?? '') ||
            isCardServiceLabel(item.stringLabel);
        const fromServicesGrant = (navData.current ?? []).filter(item => !portalOrCardLabel(item));

        navData.current = [
            ...(holdsPayrollMembership(role, serviceMemberships)
                ? employeeSidebarConfig.map(item => ({
                      key: item.key,
                      label: item.label,
                      icon: item.icon,
                  }))
                : []),
            ...withCorporateCards(fromServicesGrant),
        ];
    } else if (role === UserRole.EMPLOYEE) {
        generateEmployeeData();
    }

    return navData.current;
}
