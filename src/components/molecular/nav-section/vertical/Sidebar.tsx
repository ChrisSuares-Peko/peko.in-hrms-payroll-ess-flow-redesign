import { memo, useMemo } from 'react';

import { Flex, Image, Menu, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/standard';
import { PekoPackages,  RoleName } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { useRootPath } from '@src/hooks/useRootPath';

import { useNavData } from './SidebarData';

const transformNavData = (navData: any[]) =>
    navData?.map(({ stringLabel, ...item }: { key: string; stringLabel?: string }) => ({
        ...item,
        key: item.key || Math.random().toString(36).substring(2, 11), // Assign a random key if key is empty
        disabled: item.key === '',
    }));
const Sidebar = () => {
    const location = useLocation();
    const navData = useNavData();
    const navigate = useNavigate();
    const rootPath = useRootPath();
    const transformedNavData = useMemo(() => transformNavData(navData || []), [navData]);
    const { packageName, role } = useAppSelector(state => state.reducer.auth);
    const handleClick = (key: string) => {
        const path = key.replace(/^\//, '');
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
    };

    const activeKey = useMemo(
        () =>
            transformedNavData
                ?.filter(
                    item =>
                        item.key &&
                        (location.pathname === item.key ||
                            location.pathname.startsWith(`${item.key}/`))
                )
                .sort((a, b) => b.key.length - a.key.length)[0]?.key ??
            `/${location.pathname.split('/')[1]}`,
        [transformedNavData, location.pathname]
    );
    return (
        <div className="px-1 pb-4 overflow-x-hidden bg-white border-r border-gray-200 border-solid min-h-svh">
            <Flex className="w-full pt-2 pb-4 pl-6 ">
                <Image
                    src={
                        packageName === PekoPackages.Basic || role !== 'corporate' ? logo : logo // PekoOne
                    }
                    alt="logo"
                    onClick={() => navigate(rootPath)}
                    className="bg-transparent cursor-pointer"
                    preview={false}
                    width={120}
                />
            </Flex>
            <Menu
                className="app-sidebar-menu"
                mode="inline"
                items={transformedNavData}
                selectedKeys={[activeKey, location.pathname]}
                onClick={({ key }) => {
                    if (key !== '') {
                        handleClick(key);
                        navigate(key, { state: { initialActiveTab: '1' } });
                    } else {
                        message.error('non clickable');
                    }
                }}
            />
        </div>
    );
};

export default memo(Sidebar);
