import { QuestionCircleOutlined, UserOutlined } from '@ant-design/icons';
import { MenuProps } from 'antd';
import { IoBusinessOutline, IoLogOutOutline, IoPersonOutline } from 'react-icons/io5';

import SettingIcon from '@assets/icons/Settings.svg';
import LogoutIcon from '@assets/svg/Logout.svg';
import { PARTNER_EXIT_LABEL } from '@src/config-global';
import { shouldReturnToPartner } from '@src/services/ssoEntry';

// `hasEmployeeAccess` is true only when this credential also has a linked
// employee identity (via self-as-employee linking) to switch into.
export const getCorporateDropdownItems = (
    hasEmployeeAccess: boolean,
    autoLogin?: boolean
): MenuProps['items'] => [
    ...(hasEmployeeAccess
        ? [
              { key: 'switch-employee', label: 'Employee Account', icon: <IoBusinessOutline /> },
              { type: 'divider' as const },
          ]
        : []),
    { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
    {
        key: 'settings',
        label: 'Settings',
        icon: <img src={SettingIcon} alt="" style={{ width: 14, height: 14 }} />,
    },
    { key: 'help', label: 'Help center', icon: <QuestionCircleOutlined /> },
    { type: 'divider' as const },
    {
        key: 'logout',
        label: shouldReturnToPartner(autoLogin) ? PARTNER_EXIT_LABEL : 'Log out',
        icon: <img src={LogoutIcon} alt="" style={{ width: 14, height: 14 }} />,
    },
];

/**
 * The account menu for an EMPLOYEE inside the corporate shell — someone holding Corporate Cards, whether or
 * not they also hold a corporate identity.
 *
 * Distinct from getEmployeeDropdownItems, which belongs to the ESS portal and signs out with its own key.
 * Employees used to be served `systemDropdownItems` here: a system-user menu with no way back to the
 * Corporate account, and a Profile link pointing at a system-user route they cannot reach.
 */
export const getCardEmployeeDropdownItems = (
    hasCorporateAccess: boolean,
    hasSubCorporateAccess = false
): MenuProps['items'] => [
    ...(hasCorporateAccess
        ? [{ key: 'switch-corporate', label: 'Corporate Account', icon: <IoPersonOutline /> }]
        : []),
    ...(hasSubCorporateAccess
        ? [
              {
                  key: 'switch-sub-corporate',
                  label: 'Sub Corporate Account',
                  icon: <IoPersonOutline />,
              },
          ]
        : []),
    ...(hasCorporateAccess || hasSubCorporateAccess ? [{ type: 'divider' as const }] : []),
    { key: 'employee-profile', label: 'Profile', icon: <UserOutlined /> },
    { key: 'help', label: 'Help center', icon: <QuestionCircleOutlined /> },
    { type: 'divider' as const },
    {
        key: 'logout',
        label: 'Log out',
        icon: <img src={LogoutIcon} alt="" style={{ width: 14, height: 14 }} />,
    },
];

// Each flag is true only where this credential holds that identity too — a separate invite in every case,
// and one the server has already confirmed names the same employer.
export const getEmployeeDropdownItems = (
    hasCorporateAccess: boolean,
    hasSubCorporateAccess = false
): MenuProps['items'] => [
    ...(hasCorporateAccess
        ? [{ key: 'switch-corporate', label: 'Corporate Account', icon: <IoPersonOutline /> }]
        : []),
    ...(hasSubCorporateAccess
        ? [
              {
                  key: 'switch-sub-corporate',
                  label: 'Sub Corporate Account',
                  icon: <IoPersonOutline />,
              },
          ]
        : []),
    ...(hasCorporateAccess || hasSubCorporateAccess ? [{ type: 'divider' as const }] : []),
    { key: 'profile', label: 'Profile', icon: <IoBusinessOutline /> },
    { type: 'divider' as const },
    { key: 'signout', label: 'Sign out', danger: true, icon: <IoLogOutOutline /> },
];

export const systemDropdownItems: MenuProps['items'] = [
    { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { type: 'divider' as const },
    {
        key: 'logout',
        label: 'Log out',
        icon: <img src={LogoutIcon} alt="" style={{ width: 14, height: 14 }} />,
    },
];
