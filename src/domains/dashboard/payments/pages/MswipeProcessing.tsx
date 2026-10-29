import { useEffect, useRef } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { setUserInfo } from '@src/slices/userSlice';
import { accessKeys } from '@utils/accessKeys';

import { setVisaOrderNumber } from '../../CorporateTravel/store/visaSlice';
import { completeMswipePayment } from '../api';

const PAYMENTS_ROUTE = `/${paths.payments.index}`;
const navSuccess = `${PAYMENTS_ROUTE}/${paths.payments.paymentsuccess}`;
const navFailure = `${PAYMENTS_ROUTE}/${paths.payments.paymentFailure}`;
const navPending = `${PAYMENTS_ROUTE}/${paths.payments.paymentPending}`;

const toPaymentsRoute = (target: string) =>
    target.startsWith('/') ? target : `${PAYMENTS_ROUTE}/${target}`;

function retryIfPending<T extends { pending?: boolean; processing?: boolean }>(
    fn: () => Promise<T | false>,
    retries: number,
    delayMs: number
): Promise<T | false> {
    return fn().then(res => {
        if (!res || (!res.pending && !res.processing) || retries === 0) return res;
        return new Promise<void>(resolve => setTimeout(resolve, delayMs)).then(() =>
            retryIfPending(fn, retries - 1, delayMs)
        );
    });
}

const findButtonTextAndLink = (accessKey?: string) => {
    switch (accessKey) {
        case accessKeys.airline:
            return {
                firstBtnText: 'Go to Manage Bookings',
                firstBtnLink: `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}`,
            };
        case accessKeys.prepaid:
            return {
                firstBtnText: 'Go to Mobile Recharge',
                firstBtnLink: `/mobile-recharge-&-bills`,
            };
        case accessKeys.eSim:
        case accessKeys.eSimTunz:
            return {
                firstBtnText: 'Install eSIM',
                firstBtnLink: '/corporate-travel/eSIM/orders/package-details',
            };
        case accessKeys.giftCards:
        case accessKeys.xoxoday:
            return {
                firstBtnText: 'Go to Gift Cards',
                firstBtnLink: `/${paths.giftcards.index}`,
            };
        case accessKeys.corporateCards:
            return {
                firstBtnText: 'Go to Corporate Cards',
                firstBtnLink: `/${paths.dashboard.corporateCard}`,
            };
        case accessKeys.shipmentServices:
            return {
                firstBtnText: 'Go to Order History',
                firstBtnLink: `/${paths.logistics.index}/${paths.logistics.orderHistory}`,
            };
        default:
            return {
                firstBtnText: 'Go to Utility Payments',
                firstBtnLink: '/utility-payments',
            };
    }
};

const MswipeProcessing = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const { payload, url, successPath } = useAppSelector(state => state.reducer.payment);
    const orderId = searchParams.get('orderId');
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;
        if (!orderId) {
            navigate(navFailure);
            return;
        }

        const [retries, delayMs] = payload?.accessKey === accessKeys.visa ? [12, 2000] : [4, 1500];
        retryIfPending(
            () => completeMswipePayment({ userId: id, userType: role, ORDERID: orderId }),
            retries,
            delayMs
        ).then(res => {
            if (!res) {
                navigate(navFailure);
                return;
            }
            if (res.corporateFinalBalance != null) {
                dispatch(setUserInfo({ user: { ...user!, balance: res.corporateFinalBalance } }));
            }
            if (res.failed) {
                navigate(navFailure, {
                    state: {
                        responseCode: res.responseCode,
                        errorMessage: res.failureMessage ?? res.details?.message,
                    },
                });
                return;
            }
            if (res.pending || res.processing) {
                const { firstBtnText, firstBtnLink } = findButtonTextAndLink(payload?.accessKey);
                navigate(navPending, {
                    state: {
                        ...res.details,
                        corporateTxnId: res.corporateTxnId,
                        accessKey: payload?.accessKey,
                        successUrl: res.successUrl,
                        firstBtnText,
                        firstBtnLink,
                    },
                });
                return;
            }
            if (url?.includes('softwaresV2')) {
                navigate(toPaymentsRoute(paths.payments.subscriptionPending), {
                    state: { transactionId: res.corporateTxnId },
                });
                return;
            }
            let query = '';
            if (res.bulkPaymentData) {
                const bulkPaymentDataString = encodeURIComponent(
                    JSON.stringify(res.bulkPaymentData)
                );
                const isEsim =
                    payload?.accessKey === accessKeys.eSim ||
                    payload?.accessKey === accessKeys.eSimTunz ||
                    Array.isArray(payload?.orderGroups);
                query = `?status=success&bulkPaymentData=${bulkPaymentDataString || ''}${isEsim ? '&serviceName=esim' : ''}`;
            } else {
                query = `?status=success&transactionId=${res.corporateTxnId || ''}`;
            }
            if (payload?.accessKey === accessKeys.visa) {
                const orderNumber =
                    (res as any)?.orderNumber ??
                    (res as any)?.order_number ??
                    (payload as any).orderNumber;
                if (orderNumber) dispatch(setVisaOrderNumber(orderNumber));
                navigate(
                    `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.visaSuccess}`,
                    { state: { orderNumber } }
                );
            } else if (successPath) {
                navigate(toPaymentsRoute(successPath + query));
            } else if (res.successUrl) {
                navigate(toPaymentsRoute(res.successUrl + query));
            } else {
                navigate(`${navSuccess}${query}`);
            }
        });
    }, [dispatch, id, navigate, orderId, payload, role, successPath, url, user]);

    return (
        <Flex
            vertical
            justify="center"
            align="center"
            gap={24}
            className="pgsuccess min-h-[60vh] md:pt-12"
        >
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <Flex vertical align="center" gap={8}>
                <Typography.Title level={4} className="!m-0">
                    Processing your payment
                </Typography.Title>
                <Typography.Text type="secondary">
                    Please do not close or refresh this page.
                </Typography.Text>
            </Flex>
        </Flex>
    );
};

export default MswipeProcessing;
