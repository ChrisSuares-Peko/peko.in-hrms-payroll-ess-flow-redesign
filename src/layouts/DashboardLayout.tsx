import React, { useState } from 'react';

import { LoadingOutlined, MenuOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Layout, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import Logo from '@assets/mainLogo/standard';
import CustomBreadCrumb from '@components/molecular/breadcrumbs/CustomBreadcrumb';
import Footer from '@components/molecular/footer';
import Spinner from '@components/molecular/loaders/Spinner';
// import IdleWarningModal from '@components/molecular/modals/IdleWarningModal'; // disabled — idle routes straight to /session-expired
import CustomHeader from '@components/molecular/nav-section/horizontal/CustomHeader';
import MobileHeader from '@components/molecular/nav-section/horizontal/MobileHeader';
import Sidebar from '@components/molecular/nav-section/vertical/Sidebar';
import SideBarModal from '@components/molecular/nav-section/vertical/SideBarModal';
import SearchTree from '@components/molecular/searchTree/SearchTree';
import { UserRole } from '@customtypes/general';
import { useCardOnboardingState } from '@src/domains/dashboard/corporateCards/hooks/user/useCardOnboardingState';
import { useAppSelector } from '@src/hooks/store';
import useIdleDetection from '@src/hooks/useIdleDetection';
import useScreenSize from '@src/hooks/useScreenSize';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';

const { Header, Content, Sider } = Layout;

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const { isLoading } = useUserInfo();
    useCardOnboardingState();
    const { role } = useAppSelector(state => state.reducer.auth);
    const { lg } = useScreenSize();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    useIdleDetection();

    const route = pathname.split('/')[1];

    const handleDraggerOpen = () => {
        setDrawerOpen(true);
    };
    return isLoading ? (
        <Flex className="items-center justify-center min-w-full min-h-svh">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </Flex>
    ) : (
        <>
            <Layout className="overflow-hidden bg-white min-h-svh max-h-svh">
                {lg && (
                    <Sider
                        breakpoint="lg"
                        collapsedWidth="0"
                        width={270}
                        style={{ background: '#ffffff' }}
                        className="hidden overflow-y-scroll hide-scroll lg:block myNavClass"
                    >
                        <Sidebar />
                    </Sider>
                )}
                <Layout>
                    <Header className="px-0 py-2 bg-white border-b border-solid lg:py-0 lg:pr-9 xl:pr-5 xxl:pr-9 lg:ps-10 hidden lg:block h-fit myHeaderClass">
                        <Flex justify="space-between" align="center" className="h-fit">
                            <Flex gap={8} align="center" className="myFlexClass">
                                <Button
                                    type="text"
                                    className="flex items-center justify-center"
                                    style={{ background: '#ffffff' }}
                                    icon={<MenuOutlined style={{ fontSize: 20 }} />}
                                    onClick={() => setDrawerOpen(true)}
                                />
                                {/* antd's Image wrapper is inline-block, so it carries the line-box
                                    descender and sat lower than a flex-centred sibling. `mt-3` on the
                                    button used to compensate and overshot the other way. */}
                                <Image
                                    src={Logo}
                                    alt="logo"
                                    rootClassName="flex"
                                    className="bg-transparent cursor-pointer myHamburgerClass"
                                    preview={false}
                                    width={100}
                                    onClick={() => navigate(paths.dashboard.home)}
                                />
                            </Flex>
                            <CustomHeader />
                        </Flex>
                    </Header>
                    <Header className="px-0 py-2 bg-white border-b border-solid lg:py-3 lg:px-10 xs:inline lg:hidden">
                        <MobileHeader handleDraggerOpen={handleDraggerOpen} />
                    </Header>
                    <Spinner />
                    <Content
                        className={`${route === 'corporate-travel' ? 'px-2' : 'px-5'} py-4 overflow-y-scroll bg-white sm:pt-8 sm:px-10`}
                        id="myContainer"
                    >
                        <CustomBreadCrumb />
                        {role === UserRole.SYSTEM && !lg && (
                            <Flex align="center" className="pb-5">
                                <SearchTree />
                            </Flex>
                        )}
                        <div className="sm:my-4 dynamic-min-height">{children}</div>
                        <Footer />
                    </Content>
                </Layout>
            </Layout>
            <SideBarModal drawerOpen={drawerOpen} handleCancel={() => setDrawerOpen(false)} />
            {/* Idle-warning modal disabled — idle now routes directly to /session-expired.
            <IdleWarningModal
                isOpen={isWarningOpen}
                handleCancel={dismissWarning}
                handleSubmit={dismissWarning}
                isLoading={false}
            /> */}
        </>
    );
};

export default DashboardLayout;
