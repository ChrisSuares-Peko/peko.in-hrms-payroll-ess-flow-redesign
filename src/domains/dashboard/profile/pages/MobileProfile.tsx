import { Suspense, type FC, useState, lazy, useEffect } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Card, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { PARTNER_EXIT_LABEL } from '@src/config-global';
import { getAvailableRoles } from '@src/domains/auth/api/index';
import useSwitchRole from '@src/domains/auth/hooks/useSwitchRole';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { handleLogout } from '@src/services/handleLogout';
import { shouldReturnToPartner } from '@src/services/ssoEntry';

import Footer from '../components/Footer';
import ProfileInfo from '../components/ProfileInfo';
import useGetPasswordPolicies from '../hooks/useGetPasswordPolicies';
import usePasswordPolicyValidation from '../hooks/usePasswordPolicyValidation';

const AddressMobileModalModal = lazy(
    () => import('../components/MobileProfile/AddressMobileModal')
);
const BankAccountMobileModal = lazy(
    () => import('../components/MobileProfile/BankAccountMobileModal')
);
const ReferralMobileModal = lazy(() => import('../components/MobileProfile/ReferralMobileModal'));
const ChangerPasswordModal = lazy(() => import('../components/ChangePasswordModal'));
const SecurityMobileModal = lazy(() => import('../components/MobileProfile/SecurityMobileModal'));
const BasicInfoModal = lazy(() => import('../components/BasicInfoModal'));
const CompanyInfoModal = lazy(() => import('../components/CompanyInfoModal'));

interface MobileProfileProps {}

const MobileProfile: FC<MobileProfileProps> = () => {
    const { autoLogin } = useAppSelector(state => state.reducer.auth);
    const [openBasicInfoModal, setOpenBasicInfoModal] = useState(false);
    const [openCompanyInfoModal, setOpenCompanyInfoModal] = useState(false);
    const [openSecurityMobileModal, setOpenSecurityMobileModal] = useState(false);
    const [openReferralMobileModal, setOpenReferralMobileModal] = useState(false);
    const [openBankAccountMobileModal, setOpenBankAccountMobileModal] = useState(false);
    const [openAddressMobileModalModal, setOpenAddressMobileModalModal] = useState(false);
    const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
    const authChannel = new BroadcastChannel('authChannel');
    const navigate = useNavigate();
    const [hasEmployeeAccess, setHasEmployeeAccess] = useState(false);
    const { switchRole, isSwitching } = useSwitchRole();

    // Offered only where the credential actually holds an employee identity — which is also what makes the
    // switch safe to call directly here: the server provisions a missing row only for the account holder,
    // and getAvailableRoles does not name the role until that row exists.
    useEffect(() => {
        getAvailableRoles().then(roles => {
            setHasEmployeeAccess(roles.some(r => r.role === 'user'));
        });
    }, []);

    const { respData } = useGetPasswordPolicies();
    const { validatePassword } = usePasswordPolicyValidation(respData);
    return (
        <>
            <Flex vertical gap={20} className="w-full">
                <Typography.Text className=" font-semibold text-sm text-black">
                    My Profile
                </Typography.Text>
                <ProfileInfo />

                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => setOpenBasicInfoModal(true)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Basic Information</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => setOpenCompanyInfoModal(true)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Company Information</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => setOpenReferralMobileModal(true)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Referral</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => setOpenBankAccountMobileModal(true)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Bank Accounts</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => setOpenAddressMobileModalModal(true)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Address</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => navigate(paths.dashboard.settings)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Settings</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                <Card
                    size="small"
                    className="rounded-[3px] border-neutralGray500 cursor-pointer"
                    onClick={() => setOpenChangePasswordModal(true)}
                >
                    <Flex justify="space-between">
                        <Typography.Text>Change Password</Typography.Text>
                        <RightOutlined className="text-[lightGray!important]" />
                    </Flex>
                </Card>
                {hasEmployeeAccess && (
                    <Card
                        size="small"
                        className="rounded-[3px] border-neutralGray500 cursor-pointer"
                        onClick={() => {
                            if (!isSwitching) switchRole('user');
                        }}
                    >
                        <Flex justify="space-between">
                            <Typography.Text>Employee Account</Typography.Text>
                            <RightOutlined className="text-[lightGray!important]" />
                        </Flex>
                    </Card>
                )}
                <Card
                    size="small"
                    className="rounded-[3px] border-brandColor cursor-pointer"
                    onClick={() => {
                        authChannel.postMessage('logout');
                        handleLogout();
                    }}
                >
                    <Flex justify="space-between" className="text-brandColor">
                        <Typography.Text className="text-brandColor">
                            {shouldReturnToPartner(autoLogin) ? PARTNER_EXIT_LABEL : 'Log out'}
                        </Typography.Text>
                        <RightOutlined />
                    </Flex>
                </Card>
                <Footer />
            </Flex>

            <Suspense>
                <BasicInfoModal
                    open={openBasicInfoModal}
                    handleCancel={() => setOpenBasicInfoModal(false)}
                />
                <CompanyInfoModal
                    open={openCompanyInfoModal}
                    handleCancel={() => setOpenCompanyInfoModal(false)}
                />
                <SecurityMobileModal
                    open={openSecurityMobileModal}
                    handleCancel={() => setOpenSecurityMobileModal(false)}
                />
                <ReferralMobileModal
                    open={openReferralMobileModal}
                    handleCancel={() => setOpenReferralMobileModal(false)}
                />
                <BankAccountMobileModal
                    open={openBankAccountMobileModal}
                    handleCancel={() => setOpenBankAccountMobileModal(false)}
                />
                <AddressMobileModalModal
                    open={openAddressMobileModalModal}
                    handleCancel={() => setOpenAddressMobileModalModal(false)}
                />
                {openChangePasswordModal && (
                    <ChangerPasswordModal
                        validatePassword={validatePassword}
                        open={openChangePasswordModal}
                        handleCancel={() => setOpenChangePasswordModal(false)}
                    />
                )}
            </Suspense>
        </>
    );
};

export default MobileProfile;
