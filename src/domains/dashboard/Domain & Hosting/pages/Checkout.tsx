import { useEffect, useState } from 'react';

import { Alert, Button, Card, Form, type RadioChangeEvent, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';

import { updateCartItemDetails } from '../api/index';
import CustomerAuthForms from '../components/checkout/CustomerAuthForms';
// import CustomerInfoCard from '../components/checkout/CustomerInfoCard';
import DomainAssignmentCard from '../components/checkout/DomainAssignmentCard';
import useDomainHostingCheckout from '../hooks/useDomainHostingCheckout';
import useLoginCustomer from '../hooks/useLoginCustomer';
import useRegisterCustomer from '../hooks/useRegisterCustomer';
import useSearchDomains from '../hooks/useSearchDomains';
import useServiceCart from '../hooks/useServiceCart';
import { type DomainResult, type RegisterCustomerPayload } from '../types/index';

const { Title } = Typography;

type DomainOption = 'register' | 'existing';
type AuthMode = 'register' | 'login';

const Checkout = () => {
    const [error, setError] = useState<string | null>(null);
    const [authMode, setAuthMode] = useState<AuthMode>('register');
    const [domainOption, setDomainOption] = useState<DomainOption>('existing');
    const [domainSearch, setDomainSearch] = useState('');
    const [existingDomain, setExistingDomain] = useState('');
    const [assignedDomain, setAssignedDomain] = useState<string | null>(null);
    const [domainUpdateLoading, setDomainUpdateLoading] = useState(false);
    const [changeCustomerMode, setChangeCustomerMode] = useState(false);
    const [cartFetching, setCartFetching] = useState(true);

    const [registerForm] = Form.useForm();
    const [loginForm] = Form.useForm();

    const { handleRegister, isLoading: registerLoading } = useRegisterCustomer();
    const { handleLogin, isLoading: loginLoading } = useLoginCustomer();
    const { handleSearch, isLoading: searchLoading } = useSearchDomains();
    const { fetchCart, handleAddToCart, cartConflictModalProps } = useServiceCart();
    const { handleProceedToPayment, loading: checkoutLoading } = useDomainHostingCheckout();

    const { role, id } = useAppSelector(state => state.reducer.auth);
    const cartData = useAppSelector(state => state.reducer.domainHosting.cartData);
    const customerId = useAppSelector(state => state.reducer.domainHosting.customerId);
    const searchResults = useAppSelector(state => state.reducer.domainHosting.searchResults);
    const basicInfo = useAppSelector(state => state.reducer.basicInfo.data);
    const userInfo = useAppSelector(state => state.reducer.user.user);
    const addresses = useAppSelector(state => state.reducer.address.tableData);
    const customerFromCart = cartData?.customerDetails ?? null;

    const hasDomainInCart = cartData?.items?.some(i => i.itemType === 'domain') ?? false;
    const hasHostingItem =
        cartData?.items?.some(
            i =>
                i.itemType === 'vps_server' ||
                i.itemType === 'shared_hosting' ||
                i.itemType === 'google_workspace' ||
                i.itemType === 'titan_email'
        ) ?? false;
    const needsDomainAssignment = hasHostingItem && !hasDomainInCart;
    const isCustomerReady = !!customerId && (!customerFromCart || !changeCustomerMode);
    const canProceed = isCustomerReady && (!needsDomainAssignment || !!assignedDomain);

    useEffect(() => {
        fetchCart(true).finally(() => setCartFetching(false));
    }, [fetchCart]);

    useEffect(() => {
        if (isCustomerReady) return;
        const addr = addresses?.[0];
        registerForm.setFieldsValue({
            name: basicInfo?.contactPersonName ?? userInfo?.contactPersonName ?? '',
            company: basicInfo?.companyName ?? userInfo?.companyName ?? '',
            username: basicInfo?.email ?? userInfo?.email ?? '',
            addressLine1: addr?.addressLine1 ?? '',
            city: basicInfo?.city ?? addr?.city ?? '',
            state: basicInfo?.state || addr?.state || undefined,
            zipcode: addr?.zipCode ?? addr?.pincode ?? '',
            phone: basicInfo?.mobileNo ?? userInfo?.mobileNo ?? addr?.phoneNumber ?? '',
        });
    }, [basicInfo, userInfo, addresses, registerForm, isCustomerReady]);

    const onRegisterSubmit = async (values: Omit<RegisterCustomerPayload, 'userId' | 'userType'>) => {
        setError(null);
        // Country & phone country code are not collected on the form — the backend defaults them to India.
        const result = await handleRegister(values);
        if (!result) setError('Registration failed. Please try again.');
    };

    const onLoginSubmit = async (values: { username: string; passwd: string }) => {
        setError(null);
        const result = await handleLogin(values.username, values.passwd);
        if (!result) setError('Login failed. Please check your credentials.');
    };

    const onAuthModeChange = (mode: AuthMode) => {
        setAuthMode(mode);
        setError(null);
        registerForm.resetFields();
        loginForm.resetFields();
    };

    const assignDomainToCartItems = async (domain: string) => {
        const nonDomainItems = cartData?.items?.filter(i => i.itemType !== 'domain') ?? [];
        await Promise.all(
            nonDomainItems.map(item =>
                updateCartItemDetails({
                    userId: id,
                    userType: role,
                    productId: item.productId,
                    planId: item.planId ?? null,
                    domainName: domain,
                })
            )
        );
        setAssignedDomain(domain);
    };

    const onExistingDomainSubmit = async () => {
        const domain = existingDomain.trim();
        if (!domain) return;
        setDomainUpdateLoading(true);
        await assignDomainToCartItems(domain);
        setDomainUpdateLoading(false);
    };

    const onDomainOptionChange = (e: RadioChangeEvent) => {
        setDomainOption(e.target.value as DomainOption);
        setDomainSearch('');
        setExistingDomain('');
    };

    const onChangeDomain = () => {
        setExistingDomain(assignedDomain ?? '');
        setDomainOption('existing');
        setAssignedDomain(null);
    };

    const exactMatch = searchResults?.exactMatch?.[0];
    const availableDomains = [
        ...(exactMatch?.available ? [exactMatch] : []),
        ...(searchResults?.suggestions ?? []).filter(d => d.available),
    ];

    const renderCustomerContent = () => {
        // Existing customer detection hidden — only new registrations allowed
        // if (customerFromCart && !changeCustomerMode) {
        //     return (
        //         <CustomerInfoCard
        //             customerFromCart={customerFromCart}
        //             onRegisterNew={() => { setChangeCustomerMode(true); setAuthMode('register'); setError(null); }}
        //             onLoginDifferent={() => { setChangeCustomerMode(true); setAuthMode('login'); setError(null); }}
        //         />
        //     );
        // }
        if (isCustomerReady) {
            return <Alert type="success" message="Customer registered successfully" showIcon />;
        }
        return (
            <CustomerAuthForms
                authMode={authMode}
                onAuthModeChange={onAuthModeChange}
                registerForm={registerForm}
                loginForm={loginForm}
                onRegisterSubmit={onRegisterSubmit}
                onLoginSubmit={onLoginSubmit}
                registerLoading={registerLoading}
                loginLoading={loginLoading}
                error={error}
                showBackButton={changeCustomerMode && !!customerFromCart}
                onBack={() => setChangeCustomerMode(false)}
            />
        );
    };

    if (cartFetching) {
        return (
            <Content className="p-6 bg-white min-h-screen">
                <Skeleton active paragraph={{ rows: 4 }} className="mb-6" />
                <Skeleton active paragraph={{ rows: 6 }} />
            </Content>
        );
    }

    return (
        <Content className="p-6 bg-white min-h-screen">
            <div className="mb-6">
                <Title level={4} style={{ margin: 0 }}>Order Processing</Title>
            </div>

            {needsDomainAssignment && (
                <DomainAssignmentCard
                    assignedDomain={assignedDomain}
                    domainOption={domainOption}
                    onDomainOptionChange={onDomainOptionChange}
                    domainSearch={domainSearch}
                    onDomainSearchChange={setDomainSearch}
                    existingDomain={existingDomain}
                    onExistingDomainChange={setExistingDomain}
                    availableDomains={availableDomains}
                    searchLoading={searchLoading}
                    searchResults={searchResults}
                    domainUpdateLoading={domainUpdateLoading}
                    onDomainSearch={() => { if (domainSearch.trim()) handleSearch(domainSearch.trim()); }}
                    onExistingDomainSubmit={onExistingDomainSubmit}
                    onAssignDomain={async (domain: DomainResult) => {
                        setDomainUpdateLoading(true);
                        await handleAddToCart({
                            itemType: 'domain',
                            productId: domain.classkey,
                            productName: domain.domain,
                        });
                        await assignDomainToCartItems(domain.domain);
                        setDomainUpdateLoading(false);
                    }}
                    onChangeDomain={onChangeDomain}
                />
            )}

            <Card className="mb-6" style={{ maxWidth: 900 }}>
                <div className="mb-4">
                    <Title level={5} style={{ margin: 0 }}>Register Information</Title>
                </div>
                {renderCustomerContent()}
            </Card>

            <Button
                size="large"
                className="bg-lightRed border-lightRed text-white disabled:opacity-50"
                disabled={!canProceed}
                loading={checkoutLoading}
                onClick={() => handleProceedToPayment(assignedDomain)}
            >
                Proceed to Payment
            </Button>
            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default Checkout;
