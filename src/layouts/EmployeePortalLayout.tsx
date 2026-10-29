import { useState } from 'react';

import { MenuOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Layout } from 'antd';
import { useNavigate } from 'react-router-dom';

import Logo from '@assets/mainLogo/Logo.png';
import CustomBreadCrumb from '@components/molecular/breadcrumbs/CustomBreadcrumb';
import Footer from '@components/molecular/footer';
import Spinner from '@components/molecular/loaders/Spinner';
import Sidebar from '@components/molecular/nav-section/vertical/Sidebar';
import SideBarModal from '@components/molecular/nav-section/vertical/SideBarModal';
import { useCardOnboardingState } from '@src/domains/dashboard/corporateCards/hooks/user/useCardOnboardingState';
import EmployeeHeader from '@src/domains/employee/components/EmployeeHeader';
import { useRootPath } from '@src/hooks/useRootPath';
import useScreenSize from '@src/hooks/useScreenSize';
import useUserInfo from '@src/hooks/useUserInfo';

const { Header, Content, Sider } = Layout;

// Matches AE's EmployeePortalLayout.tsx exactly: Sider gated by both the `lg`
// JS breakpoint (useScreenSize, same hook AE uses byte-for-byte) and antd's own
// Sider `breakpoint` prop, Headers gated by the matching Tailwind `lg:` classes.
// The desktop header's logo carries `myHamburgerClass` (hidden by default, see
// index.css) which a raw CSS media query force-shows between 990-1402px — the
// same range where antd's JS breakpoint hook is unreliable and would otherwise
// leave both the Sider and the mobile header absent at once.
type EmployeePortalLayoutProps = {
    children: React.ReactNode;
};

const EmployeePortalLayout = ({ children }: EmployeePortalLayoutProps) => {
    const { lg } = useScreenSize();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const rootPath = useRootPath();
    useUserInfo();
    useCardOnboardingState();

    return (
        <>
            <Layout className="employee-portal-root overflow-hidden bg-white min-h-svh max-h-svh">
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
                    <Header className="hidden px-0 py-2 bg-white border-b border-solid lg:block lg:py-0 lg:pr-9 xl:pr-5 xxl:pr-9 lg:ps-10 h-fit myHeaderClass">
                        <Flex justify="space-between" align="center" className="h-fit min-h-[64px]">
                            {/* Between 990px and 1402px index.css hides the Sider and shows this group
                                instead. The corporate shell has carried the hamburger here all along; the
                                employee one carried only the logo, so an employee in that band lost the
                                sidebar with no way to open it. */}
                            <Flex gap={8} align="center" className="myFlexClass">
                                <Button
                                    type="text"
                                    className="flex items-center justify-center"
                                    style={{ background: '#ffffff' }}
                                    icon={<MenuOutlined style={{ fontSize: 20 }} />}
                                    onClick={() => setDrawerOpen(true)}
                                />
                                <Image
                                    src={Logo}
                                    alt="logo"
                                    rootClassName="flex"
                                    className="bg-transparent cursor-pointer myHamburgerClass"
                                    preview={false}
                                    width={100}
                                    onClick={() => navigate(rootPath)}
                                />
                            </Flex>
                            {/* EmployeeHeader is w-full, which as a bare flex child resolves against the
                                row and overflows it, carrying its right-aligned content off-screen. */}
                            <div className="min-w-0 flex-1">
                                <EmployeeHeader />
                            </div>
                        </Flex>
                    </Header>
                    {/* Mobile header. Carries the account menu too: it is the only route to profile,
                        role switching and sign-out, and below lg the desktop header that held it is gone. */}
                    <Header className="px-4 py-2 bg-white border-b border-solid lg:hidden">
                        <Flex justify="space-between" align="center" gap={8}>
                            <Flex align="center" gap={5} className="shrink-0">
                                <Button
                                    type="text"
                                    className="flex items-center justify-center"
                                    style={{ background: '#ffffff' }}
                                    icon={<MenuOutlined style={{ fontSize: 20 }} />}
                                    onClick={() => setDrawerOpen(true)}
                                />
                                <Image
                                    src={Logo}
                                    alt="logo"
                                    rootClassName="flex"
                                    className="bg-transparent cursor-pointer"
                                    preview={false}
                                    width={100}
                                    onClick={() => navigate(rootPath)}
                                />
                            </Flex>
                            <EmployeeHeader />
                        </Flex>
                    </Header>
                    <Spinner />
                    <Content
                        className="px-5 py-4 overflow-y-scroll bg-white sm:pt-8 sm:px-10"
                        id="myContainer"
                    >
                        <CustomBreadCrumb />
                        <div className="sm:my-4 dynamic-min-height">{children}</div>
                        <Footer />
                    </Content>
                </Layout>
            </Layout>
            <SideBarModal drawerOpen={drawerOpen} handleCancel={() => setDrawerOpen(false)} />
        </>
    );
};

export default EmployeePortalLayout;
