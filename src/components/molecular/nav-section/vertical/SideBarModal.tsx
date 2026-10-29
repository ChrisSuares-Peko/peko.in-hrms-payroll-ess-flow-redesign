import React from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Drawer, Flex, Image, Menu, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/standard';
import { PekoPackages } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { useNavData } from './SidebarData';

type Props = {
    drawerOpen: boolean;
    handleCancel: () => void;
};

const transformNavData = (navData: any[]) =>
    navData?.map(({ stringLabel, ...item }: { key: string; stringLabel?: string }) => ({
        ...item,
        key: item.key || Math.random().toString(36).substring(2, 11), // Assign a random key if key is empty
        disabled: item.key === '',
    }));
const SideBarModal = ({ drawerOpen, handleCancel }: Props) => {
    const location = useLocation();
    const navData = useNavData();

    const navigate = useNavigate();
    const transformedNavData = transformNavData(navData!);

    const { packageName, role } = useAppSelector(state => state.reducer.auth);

    return (
        <Drawer
            size="default"
            title={
                <Flex className="w-full" align="center" justify="space-between">
                    <Image
                        src={
                            packageName === PekoPackages.Basic || role !== 'corporate' ? logo : logo // PekoOne
                        }
                        alt="logo"
                        onClick={() => navigate('/dashboard')}
                        className="bg-transparent cursor-pointer -ms-2.5"
                        preview={false}
                        width={120}
                    />
                    <CloseOutlined className="text-xl cursor-pointer" onClick={handleCancel} />
                </Flex>
            }
            closable={false}
            className="drawerbody"
            placement="left"
            height={100}
            open={drawerOpen}
            onClose={handleCancel}
        >
            <div className="px-1 pb-4 overflow-x-hidden bg-white border-r border-gray-200 border-solid min-h-svh">
                <Menu
                    mode="inline"
                    items={transformedNavData}
                    selectedKeys={[`/${location.pathname.split('/')[1]}`, location.pathname]}
                    onClick={({ key }) => {
                        if (key !== '') {
                            navigate(key, { state: { initialActiveTab: '1' } });
                            handleCancel();
                        } else {
                            message.error('non clickable');
                        }
                    }}
                />
            </div>
        </Drawer>
    );
};

export default SideBarModal;
