import React, { useEffect, useState } from 'react';

import { Result, Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Skeleton from 'react-loading-skeleton';
import Lottie from 'react-lottie';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { packageRoutes } from '@domains/dashboard/settings/utils';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';

import { PLAN_DETAILS_SESSION_KEY } from '../utils';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const serviceTitles: { [key: string]: string } = {
    Payroll: 'Your payment for Payroll subscription was successful',
    Cloud: 'Your payment for Hub subscription was successful',
    Hub: 'Your payment for Hub subscription was successful',
    eSign: 'Your payment for eSign subscription was successful',
    Invoicing: 'Your payment for Invoicing subscription was successful',
    'WhatsApp For Business': 'Your payment for WhatsApp Business subscription was successful',
    Travel: 'Your payment for Corporate Travel subscription was successful',
    Cards: 'Your payment for Corporate Cards subscription was successful',
    'Corporate cards': 'Your payment for Corporate Cards subscription was successful',
    Turbo: 'Your payment for Turbo subscription was successful',
    isMandate: 'Mandate Set Up Successfully',
    default: 'Payment Successful',
};

const addonServiceTitles: { [key: string]: string } = {
    Payroll: 'Your payment for Payroll Addon subscription was successful',
    Cloud: 'Your payment for Hub Addon subscription was successful',
    Hub: 'Your payment for Hub Addon subscription was successful',
    eSign: 'Your payment for eSign Addon subscription was successful',
    Invoicing: 'Your payment for Invoicing Addon subscription was successful',
    Turbo: 'Your payment for Turbo Addon subscription was successful',
};

const serviceSubTitles: { [key: string]: string } = {
    isMandate:
        'Your recurring payment mandate is active. Add-on renewals will be auto-charged going forward.',
};

// Build the addon-specific success message when the session indicates a mandate-with-addon
// flow (e.g. Peko Free user buying their first Payroll addon — the same checkout sets up the
// mandate AND activates the addon). The headline becomes "Add-on Purchased Successfully" and
// the second line carries the service-specific detail (employees added / e-signs available / etc.).
type AddOnPaymentPayload = {
    addonsAccessKey?: string;
    quantity?: string | number;
    title?: string;
    rows?: Array<{ column1?: string; column2?: string; column3?: string }>;
};
const getAddonSuccessCopy = (payload: AddOnPaymentPayload): { title: string; subTitle: string } => {
    const quantity = Number(payload?.quantity ?? 0);
    const service = (payload?.title ?? '').toLowerCase();
    const title = 'Add-on Purchased Successfully';

    let detail: string;
    if (service === 'payroll') {
        detail = `${quantity} ${quantity === 1 ? 'employee has' : 'employees have'} been added to your Payroll. Future renewals will be auto-charged via your mandate.`;
    } else if (service === 'esign' || service === 'e-sign') {
        detail = `${quantity} additional e-signs are now available on your account.`;
    } else if (service === 'invoicing') {
        detail = `${quantity} additional invoices are now available on your account.`;
    } else if (service === 'turbo') {
        detail = `${quantity} additional fleet vehicles are now available on your account.`;
    } else if (payload?.title) {
        detail = `Your ${payload.title} add-on purchase is now active.`;
    } else {
        detail =
            'Your add-on purchase is now active. Future renewals will be auto-charged via your mandate.';
    }
    return { title, subTitle: detail };
};

const PaymentSuccess = () => {
    const { getUserData } = useUserInfo();
    const navigate = useNavigate();
    const location = useLocation();
    const [redirectUrl, setRedirectUrl] = useState(`${paths.dashboard.home}`);
    const [serviceName, setServiceName] = useState(`Dashboard`);
    const [addonOverride, setAddonOverride] = useState<{ title: string; subTitle: string } | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isAddonPurchase, setIsAddonPurchase] = useState(false);

    useEffect(() => {
        const lastVisited = sessionStorage.getItem('lastVisitedPath');
        const PlanDetails = sessionStorage.getItem(PLAN_DETAILS_SESSION_KEY);
        if (PlanDetails) {
            setIsLoading(false);
            const parsed = JSON.parse(PlanDetails);
            const { url, service, selectedType, addOnpaymentPayload, isAddOns } = parsed;
            setIsAddonPurchase(!!isAddOns);
             const result = sessionStorage.getItem('paymentResult');
            // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
            // if (typeof Moengage?.track_event === 'function' && result) {
            //     const successData = JSON.parse(result);

            //     Moengage.track_event(`${successData?.serviceName}_payment_result`, {
            //         status: 'success',
            //         ...successData,
            //     });
            //     sessionStorage.removeItem('paymentResult');
            // }
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            if (path === paths.dashboard.plans) {
                const serviceRoute = service
                    ? packageRoutes[service as keyof typeof packageRoutes]
                    : undefined;
                setRedirectUrl(serviceRoute ?? paths.dashboard.home);
            } else {
                setRedirectUrl(url);
                sessionStorage.setItem('lastVisitedPath', path);
            }

            if (service === 'isMandate' && addOnpaymentPayload) {
                setAddonOverride(getAddonSuccessCopy(addOnpaymentPayload));
            }

            if (service) {
                if (service === 'Peko+' && selectedType === 'annually') {
                    setRedirectUrl(paths.dashboard.home);
                    setServiceName('Dashboard');
                } else {
                    setServiceName(service);
                }
            }
        } else if (new URLSearchParams(location.search).get('status') === 'success') {
            // Net-0 / free purchase lands here via a full-page redirect, so neither PlanDetails
            // (sessionStorage) nor router state survive. The ?status=success flag confirms a real
            // success — render the success screen instead of bouncing to the dashboard.
            setIsLoading(false);
        } else {
            setIsLoading(true);
            if (lastVisited) {
                navigate(lastVisited, { replace: true });
                sessionStorage.removeItem('lastVisitedPath');
            } else {
                navigate(paths.dashboard.home);
            }
        }
        return () => {
            sessionStorage.removeItem(PLAN_DETAILS_SESSION_KEY);
        };
    }, [navigate, location.search]);

    useEffect(() => {
        getUserData();
    }, [getUserData]);

    const { packageName } = location.state || {};

    const serviceLabels: { [key: string]: string } = {
        payroll: 'Payroll',
        Cloud: 'Hub',
        eSign: 'eSign',
        Invoicing: 'Invoicing',
        'WhatsApp For Business': 'WhatsApp Business',
        isMandate: 'Payroll Settings',
        default: serviceName,
    };

    const handleClick = () => {
        navigate(`/${paths.settings.index}`, { state: { activeTab: '3' } });
    };

    const buttonLabel = serviceLabels[serviceName] || serviceLabels.default;

    const resolveTitle = (): string => {
        if (addonOverride) return addonOverride.title;
        if (packageName)
            return `Congratulations, your ${packageName.toLowerCase()} package is activated now`;
        if (isAddonPurchase && addonServiceTitles[serviceName])
            return addonServiceTitles[serviceName];
        return serviceTitles[serviceName] || serviceTitles.default;
    };

    const resolveSubTitle = (): string => {
        if (addonOverride) return addonOverride.subTitle;
        if (packageName)
            return 'Explore our range of subscription plans to unlock exclusive features and simplify your payments with Peko';
        return (
            serviceSubTitles[serviceName] ??
            'You will receive a confirmation email shortly. Thank you for choosing Peko.'
        );
    };

    const title = resolveTitle();
    const subTitle = resolveSubTitle();

    return (
        <Content className="flex items-center justify-center min-h-[30rem]">
            <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
                {isLoading ? (
                    <Skeleton />
                ) : (
                    <Result
                        className="p-0"
                        icon={<Lottie options={defaultOptions} height={100} />}
                        status="success"
                        title={title}
                        subTitle={
                            <Flex justify="center" className="px-2">
                                <Typography.Text>{subTitle}</Typography.Text>
                            </Flex>
                        }
                        extra={[
                            <Flex
                                wrap="wrap"
                                justify="center"
                                gap={12}
                                key="btn"
                                className="w-full px-2"
                            >
                                <Link to={`${redirectUrl}`}>
                                    <Button type="primary" danger>
                                        Go to {buttonLabel}
                                    </Button>
                                </Link>
                                <Button onClick={handleClick}>View Your Subscription</Button>
                            </Flex>,
                        ]}
                    />
                )}
            </Flex>
        </Content>
    );
};

export default PaymentSuccess;
