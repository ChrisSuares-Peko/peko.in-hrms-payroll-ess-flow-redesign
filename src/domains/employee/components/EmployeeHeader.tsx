import { useEffect, useState } from 'react';

import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Flex, MenuProps, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

import { getAvailableRoles } from '@domains/auth/api/index';
import useSwitchRole from '@domains/auth/hooks/useSwitchRole';
import { paths } from '@routes/paths';
import { useEssAuth } from '@src/prototype/essSession';
import { handleLogout } from '@src/services/handleLogout';
import { getEmployeeDropdownItems } from '@utils/navbarData';

const { Text } = Typography;

const EmployeeHeader = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const navigate = useNavigate();
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { username, employeeName } = useEssAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [hasCorporateAccess, setHasCorporateAccess] = useState(false);
    const [hasSubCorporateAccess, setHasSubCorporateAccess] = useState(false);
    const { switchRole } = useSwitchRole();

    const displayName = employeeName || username || 'Employee';

    useEffect(() => {
        getAvailableRoles().then(roles => {
            setHasCorporateAccess(roles.some(r => r.role === 'corporate'));
            setHasSubCorporateAccess(roles.some(r => r.role === 'sub_corporate'));
        });
    }, []);

    const accountMenuItems = getEmployeeDropdownItems(hasCorporateAccess, hasSubCorporateAccess);

    const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
        if (key === 'profile') {
            navigate(paths.employee.profile);
        } else if (key === 'switch-corporate') {
            await switchRole('corporate');
        } else if (key === 'switch-sub-corporate') {
            await switchRole('sub_corporate');
        } else if (key === 'signout') {
            if (!isLoggingOut) {
                setIsLoggingOut(true);
                await handleLogout().finally(() => setIsLoggingOut(false));
            }
        }
    };

    return (
        <Flex justify="flex-end" align="center" className="w-full">
            <Dropdown
                menu={{ items: accountMenuItems, onClick: handleMenuClick }}
                trigger={['click']}
                placement="bottomRight"
                overlayClassName="nav-user-dropdown"
                overlayStyle={{ minWidth: '160px' }}
            >
                <Flex
                    gap={10}
                    align="center"
                    className="h-12 px-3 py-2 border cursor-pointer rounded-xl"
                >
                    <Avatar size="large" draggable={false} className="bg-[#ffeeee]">
                        {displayName ? (
                            <Text style={{ color: colorPrimary }} className="text-2xl font-bold">
                                {displayName.slice(0, 1).toUpperCase()}
                            </Text>
                        ) : (
                            <UserOutlined style={{ color: colorPrimary, fontSize: 20 }} />
                        )}
                    </Avatar>
                    <Flex vertical className="hidden sm:flex">
                        <Text className="max-w-40 truncate text-xs font-semibold text-black">
                            {displayName}
                        </Text>
                        <Text className="text-xs text-gray-400">Employee</Text>
                    </Flex>
                    <DownOutlined className="text-xs text-gray-500" />
                </Flex>
            </Dropdown>
        </Flex>
    );
};

export default EmployeeHeader;
