import React, { useState } from 'react';

import { LoadingOutlined, MenuOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Drawer, Flex, Image, Layout, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

import Logo from '@assets/mainLogo/standard';
import CustomBreadCrumb from '@components/molecular/breadcrumbs/CustomBreadcrumb';
import Footer from '@components/molecular/footer';
import Spinner from '@components/molecular/loaders/Spinner';
import CustomHeader from '@components/molecular/nav-section/horizontal/CustomHeader';
import MobileHeader from '@components/molecular/nav-section/horizontal/MobileHeader';
import SearchTree from '@components/molecular/searchTree/SearchTree';
import AccountingDrillPanel from '@src/domains/admin/accounting/components/AccountingDrillPanel';
import AccountingSidebar from '@src/domains/admin/accounting/components/AccountingSidebar';
import ApprovalGateBanner from '@src/domains/admin/accounting/components/approvals/ApprovalGateBanner';
import GoLiveBanner from '@src/domains/admin/accounting/components/GoLiveBanner';
import { accountingTheme } from '@src/domains/admin/accounting/config/accountingTheme';
import {
    AccountingShellProvider,
    DrillPanel,
} from '@src/domains/admin/accounting/context/AccountingShellContext';
import { ApprovalGateProvider } from '@src/domains/admin/accounting/context/ApprovalGateContext';
import PrivacyPolicyModal from '@src/domains/auth/components/modals/PrivacyPolicyModal';
import usePrivacyAcceptApi from '@src/domains/auth/hooks/usePrivacyAcceptApi';
import { setPrivacyModalVisible } from '@src/domains/auth/slices/loginSlice';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';

const { Header, Content, Sider } = Layout;

interface AccountingLayoutProps {
    children: React.ReactNode;
}

const AccountingLayout = ({ children }: AccountingLayoutProps) => {
    const { showPrivacyPolicyModal } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { isLoading, getUserServicesData, getUserData } = useUserInfo();
    const { lg } = useScreenSize();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [panel, setPanel] = useState<DrillPanel | null>(null);
    const navigate = useNavigate();
    const { acceptPrivacyPolicyForUser, isLoading: modalButtonLoading } = usePrivacyAcceptApi();

    const closeDrawer = () => setDrawerOpen(false);

    if (isLoading) {
        return (
            <Flex className="items-center justify-center min-w-full min-h-svh">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </Flex>
        );
    }

    return (
        <ConfigProvider theme={accountingTheme}>
            <ApprovalGateProvider>
                <AccountingShellProvider value={setPanel}>
                    <Layout className="accounting-portal-root overflow-hidden bg-white min-h-svh max-h-svh">
                        {lg && panel && (
                            <>
                                <Sider
                                    width={64}
                                    style={{ background: '#ffffff' }}
                                    className="hidden overflow-y-scroll hide-scroll lg:block"
                                >
                                    <AccountingSidebar collapsed />
                                </Sider>
                                <Sider
                                    width={236}
                                    style={{ background: '#FCFCFD' }}
                                    className="hidden overflow-y-scroll hide-scroll lg:block border-r border-solid border-gray-200"
                                >
                                    <AccountingDrillPanel panel={panel} />
                                </Sider>
                            </>
                        )}
                        {lg && !panel && (
                            <Sider
                                breakpoint="lg"
                                collapsedWidth="0"
                                width={265}
                                style={{ background: '#ffffff' }}
                                className="hidden overflow-y-scroll hide-scroll lg:block myNavClass"
                            >
                                <AccountingSidebar />
                            </Sider>
                        )}
                        <Layout>
                            <Header className="px-0 py-2 bg-white border-b border-solid lg:py-0 lg:pr-9 xl:pr-5 xxl:pr-9 lg:ps-9 hidden lg:block h-fit myHeaderClass">
                                <Flex justify="space-between" align="center" className="h-fit">
                                    <Flex gap={5} align="center" className="myFlexClass">
                                        <Button
                                            type="text"
                                            className="mt-2"
                                            style={{ background: '#ffffff' }}
                                            icon={<MenuOutlined style={{ fontSize: 20 }} />}
                                            onClick={() => setDrawerOpen(true)}
                                        />
                                        <Image
                                            src={Logo}
                                            alt="logo"
                                            className="bg-transparent cursor-pointer myHamburgerClass"
                                            preview={false}
                                            width={100}
                                            onClick={() => navigate(paths.systemUser.accounting)}
                                        />
                                    </Flex>
                                    <CustomHeader />
                                </Flex>
                            </Header>
                            <Header className="px-0 py-2 bg-white border-b border-solid lg:py-3 lg:px-10 xs:inline lg:hidden">
                                <MobileHeader handleDraggerOpen={() => setDrawerOpen(true)} />
                            </Header>
                            <Spinner />
                            <Content
                                className="px-5 py-4 overflow-y-scroll bg-white sm:pt-8 sm:px-10"
                                id="myContainer"
                            >
                                {!panel && <CustomBreadCrumb />}
                                {!lg && (
                                    <Flex align="center" className="pb-5">
                                        <SearchTree />
                                    </Flex>
                                )}
                                {!lg && panel && (
                                    <AccountingDrillPanel panel={panel} mode="horizontal" />
                                )}
                                <div className="sm:my-4 dynamic-min-height">
                                    <ApprovalGateBanner />
                                    <GoLiveBanner />
                                    {children}
                                </div>
                                <Footer />
                            </Content>
                        </Layout>
                    </Layout>
                </AccountingShellProvider>
            </ApprovalGateProvider>
            <Drawer
                placement="left"
                open={drawerOpen}
                onClose={closeDrawer}
                closable={false}
                width={270}
                className="drawerbody"
                styles={{ body: { padding: 0 } }}
            >
                <AccountingSidebar onNavigate={closeDrawer} />
            </Drawer>
            {showPrivacyPolicyModal && (
                <PrivacyPolicyModal
                    isOpen={showPrivacyPolicyModal}
                    isLoading={modalButtonLoading}
                    onClose={() => dispatch(setPrivacyModalVisible(false))}
                    onAccept={async policyIds => {
                        const response = await acceptPrivacyPolicyForUser(policyIds);
                        if (response && response.status) {
                            dispatch(setPrivacyModalVisible(false));
                            getUserServicesData();
                            getUserData();
                        }
                    }}
                />
            )}
        </ConfigProvider>
    );
};

export default AccountingLayout;
