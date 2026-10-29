import { useEffect, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { setUserInfo } from '@src/slices/userSlice';
import { accessKeys } from '@utils/accessKeys';

import { completeCCavenuePayment } from '../api';

const findButtonTextAndLink = (ak?: string) => {
    if (ak === accessKeys.prepaid) {
        return { firstBtnText: 'Go to Mobile Recharge', firstBtnLink: '/mobile-recharge-&-bills' };
    }
    if (ak === accessKeys.shipmentServices) {
        return {
            firstBtnText: 'Go to Order History',
            firstBtnLink: `/${paths.logistics.index}/${paths.logistics.orderHistory}`,
        };
    }
    return { firstBtnText: 'Go to Utility Payments', firstBtnLink: '/utility-payments' };
};

const CcavenueProcessing = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(s => s.reducer.auth);
    const { user } = useAppSelector(s => s.reducer.user);
    const orderId = searchParams.get('orderId');
    const [called, setCalled] = useState(false);

    const navSuccess = `/${paths.payments.index}/${paths.payments.paymentsuccess}`;
    const navFailure = `/${paths.payments.index}/${paths.payments.paymentFailure}`;
    const navPending = `/${paths.payments.index}/${paths.payments.paymentPending}`;

    useEffect(() => {
        if (called || !orderId) {
            if (!orderId) navigate(navFailure);
            return;
        }
        setCalled(true);

        completeCCavenuePayment({ userId: id, userType: role, orderId }).then(res => {
            if (!res) {
                navigate(navFailure);
                return;
            }

            if ((res as any).corporateFinalBalance != null) {
                dispatch(
                    setUserInfo({ user: { ...user!, balance: (res as any).corporateFinalBalance } })
                );
            }

            if ((res as any).failed) {
                navigate(navFailure);
                return;
            }

            if ((res as any).pending || (res as any).processing) {
                const { firstBtnText, firstBtnLink } = findButtonTextAndLink(
                    (res as any).accessKey
                );
                navigate(navPending, {
                    state: {
                        ...(res as any).details,
                        corporateTxnId: (res as any).corporateTxnId,
                        accessKey: (res as any).accessKey,
                        successUrl: (res as any).successUrl,
                        firstBtnText,
                        firstBtnLink,
                    },
                });
                return;
            }

            const txnId = (res as any).corporateTxnId || orderId;
            const { bulkPaymentData } = res as any;
            let query: string;
            if (bulkPaymentData) {
                query = `?status=success&bulkPaymentData=${encodeURIComponent(JSON.stringify(bulkPaymentData))}`;
            } else {
                query = `?status=success&transactionId=${txnId}`;
            }

            const { successUrl } = res as any;
            if (successUrl) {
                navigate(successUrl + query);
            } else {
                navigate(navSuccess + query);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    return (
        <Flex
            vertical
            justify="center"
            align="center"
            gap={24}
            className="pgsuccess md:pt-12"
            style={{ minHeight: '60vh' }}
        >
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <Flex vertical align="center" gap={8}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Processing your payment
                </Typography.Title>
                <Typography.Text type="secondary">
                    Please do not close or refresh this page.
                </Typography.Text>
            </Flex>
        </Flex>
    );
};

export default CcavenueProcessing;
