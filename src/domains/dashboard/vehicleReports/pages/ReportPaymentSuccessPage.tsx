import { useEffect, useMemo } from 'react';

import { Button, Flex, Result, Skeleton } from 'antd';
import Lottie from 'react-lottie';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import PaymentResultTable from '@src/domains/dashboard/payments/components/PaymentResultTable';
import useGetTransactionData from '@src/domains/dashboard/payments/hooks/useGetTransactionData';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { resetPaymentData } from '../../payments/slices/payment';
import { clearVehicleReport } from '../slices/vehicleReportSlice';
import { parseCarReportOrderResponse } from '../utils/parseCarReportOrder';
import { vehicleReportsRoot } from '../utils/reportMeta';

const ordersPath = `${vehicleReportsRoot}/${paths.turbo.reportOrders}`;
const orderDetailPath = `${ordersPath}/${paths.turbo.reportOrderDetails}`;

const lottieOptions = { loop: false, autoplay: true, animationData: paymentSuccess };

// Car Reports' own post-payment screen (Figma 2876-30061) — mirrors the shared
// PaymentSuccess structure (`pgsuccess` + Result + PaymentResultTable) so spacing and
// the table match every other product, with Report/Vehicle rows added. Reached via the
// payment slice's `successPath` on the wallet and gateway legs, and via
// sessionStorage('cardPaymentSuccessPath') on the card-link leg (a full page reload, so
// the order id is resolved from the transaction's orderResponse, not redux).
const ReportPaymentSuccessPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();

    // Some legs quote the value; strip quotes before comparing.
    const status = (searchParams.get('status') || '').replace(/["']/g, '');
    const transactionId = searchParams.get('transactionId');
    const { transactionData, isLoading } = useGetTransactionData(transactionId);

    const order = useMemo(
        () => parseCarReportOrderResponse(transactionData?.orderResponse),
        [transactionData?.orderResponse]
    );

    useEffect(() => {
        // The payment slice is persisted — left populated it would re-render this
        // purchase's summary on the next /payments visit. A stale card-link key would
        // hijack the next payment's success screen.
        dispatch(resetPaymentData());
        dispatch(clearVehicleReport());
        sessionStorage.removeItem('cardPaymentSuccessPath');
    }, [dispatch]);

    if (status !== 'success') {
        return <Navigate to={vehicleReportsRoot} replace />;
    }

    const vehicle = [order.vehicleNumber, order.vehicleModel].filter(Boolean).join(' · ');
    // `amountInINR` is the catalogue total; the discount only arrives in couponData.
    // Same split as the shared PaymentSuccess screen.
    const amountInINR = Number(transactionData?.amountInINR ?? 0);
    const couponDiscount = Number(transactionData?.couponData?.discountAmount ?? 0);
    const paymentData = {
        transactionDate: transactionData?.transactionDate,
        corporateTxnId: transactionData?.corporateTxnId,
        serviceProvider: 'Car Reports',
        amount: amountInINR - couponDiscount,
        amountInINR,
        couponDiscount,
        paymentMode: transactionData?.paymentMode,
        billPaymentParams: [
            ...(order.reportName ? [{ paramName: 'Report', paramValue: order.reportName }] : []),
            ...(vehicle ? [{ paramName: 'Vehicle', paramValue: vehicle }] : []),
        ],
    };

    return (
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
            <Result
                className="p-0 md:w-3/6"
                icon={<Lottie options={lottieOptions} height={100} />}
                status="success"
                title="Payment successful"
                subTitle="We are building your report. We will notify you once the report is ready."
                extra={[
                    <Flex gap={16} justify="center" wrap="wrap" key="actions">
                        <Button
                            type="primary"
                            danger
                            loading={isLoading}
                            onClick={() =>
                                navigate(
                                    // Falls back to the list rather than a dead
                                    // ?orderId=undefined when the id can't be resolved.
                                    order.orderId
                                        ? `${orderDetailPath}?orderId=${order.orderId}`
                                        : ordersPath
                                )
                            }
                        >
                            View Order
                        </Button>
                        <Button onClick={() => navigate(vehicleReportsRoot)}>
                            Back to Vehicle Reports
                        </Button>
                    </Flex>,
                ]}
            />
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} title={false} className="lg:w-2/3" />
            ) : (
                <PaymentResultTable paymentData={paymentData} />
            )}
        </Flex>
    );
};

export default ReportPaymentSuccessPage;
