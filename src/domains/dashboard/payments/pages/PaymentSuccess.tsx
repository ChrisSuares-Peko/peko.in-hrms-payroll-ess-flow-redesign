import { useEffect, useState } from 'react';

import { Result, Button, Flex, Skeleton, Table, Image, Typography } from 'antd';
import Lottie from 'react-lottie';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import bbps from '@assets/icons/bbpsSuccess.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { resolvePaymentModeCode } from '@utils/paymentInstrument';

import { resetSessionTimer } from '../../Airline/slices/airlineSlice';
import { clearPostpaid } from '../../billPayments/slices/billPaymentSlice';
import { clearData } from '../../emailDomain/slices/businessEmailSlice';
import { clearPendingSelections } from '../../esim/slice/esimSlice';
import { clearPrepaid } from '../../telecomPayments/slice/prepaidFormSlice';
import PaymentResultSoftwares from '../components/PaymentResultSoftwares';
import PaymentResultTable from '../components/PaymentResultTable';
import useBulkPaymentStatusUpdate from '../hooks/useBulkPaymentStatusUpdate';
import useGetBulkPaymentData from '../hooks/useGetBulkPaymentData';
import useGetTransactionData from '../hooks/useGetTransactionData';
import { resetPaymentData } from '../slices/payment';
import { BulkPaymentResp } from '../types/index';
import { BulkUploadColumn } from '../utils/tableColumn';
import { checkIsBBPS, formatParamName, getSuccessPageData } from '../utils/utils';

const { Text } = Typography;
const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const getServiceProvider = (accessKey: string | undefined, fallback: string | undefined) => {
    if (accessKey === 'esim' || accessKey === 'esim_tunz') return 'Travel eSIM';
    if (accessKey === accessKeys.shipmentServices) return 'Logistics';
    if (accessKey === accessKeys.visa) return 'Visa Service';
    if (accessKey === accessKeys.vehicleReports) return 'Car Reports';
    return fallback;
};

const seperateSentences = (text: string) => {
    if (!text) return [];
    return text.split('. ');
};

const PaymentSuccess = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status')?.replace(/["']/g, '');
    const transactionId = queryParams.get('transactionId');
    const serviceName = queryParams.get('serviceName');
    const bulkPaymentDataString = queryParams.get('bulkPaymentData');
    const { bulkPaymentDatas, isLoadings: bulkDataLoading } =
        useGetBulkPaymentData(bulkPaymentDataString);
    const { transactionData, isLoading } = useGetTransactionData(transactionId);
    console.log("transactionData here",transactionData?.serviceOperator)
    let formattedInput = null;

    if (transactionData?.orderResponse) {
        try {
            const parsedData = JSON.parse(transactionData.orderResponse);
            const input = parsedData?.inputParams?.input;

            formattedInput = input
                ? [input].map(({ paramName, paramValue }) => ({
                      paramName: formatParamName(paramName ?? null),
                      paramValue: paramValue ?? null,
                  }))
                : null;
        } catch (error) {
            console.error('Failed to parse orderResponse:', error);
            formattedInput = null;
        }
    }
    const [bulkPaymentData, setBulkPaymentData] = useState<BulkPaymentResp[]>([]);
    const { md } = useScreenSize();

    const bbpsAccessKey = transactionData?.serviceOperator?.accessKey;
    let mobileNo;
    if (bbpsAccessKey === 'JRI_prepaid') {
        mobileNo = transactionData?.accountNo;
    }
    useEffect(() => {
        dispatch(resetPaymentData());
        dispatch(clearData());
        dispatch(clearPrepaid());
        dispatch(clearPostpaid());
        dispatch(clearPendingSelections());
        dispatch(resetSessionTimer());
        if (status !== 'success') {
            navigate(paths.dashboard.home);
            return;
        }
        const savedSuccessPath = sessionStorage.getItem('cardPaymentSuccessPath');
        if (savedSuccessPath) {
            sessionStorage.removeItem('cardPaymentSuccessPath');
            navigate(`${savedSuccessPath}?status=success&transactionId=${transactionId || ''}`);
            return;
        }
        const paymentResultRaw = sessionStorage.getItem('paymentResult');
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        // if (bulkPaymentDataString) {
        //     const parsedData = JSON.parse(decodeURIComponent(bulkPaymentDataString));
        //     if (serviceName === 'esim') {
        //         // eslint-disable-next-line @typescript-eslint/dot-notation
        //         parsedData[0]['serviceName'] = 'esim';
        //     }
        //     setBulkPaymentData(parsedData);
        // }
        if ((bulkPaymentDataString ?? '').length > 0 && bulkPaymentDatas) {
            const parsedData = bulkPaymentDatas.map(item => ({
                ...item,
                account: item.account ?? '',
                serviceName: serviceName ?? item.serviceName,
            }));
            setBulkPaymentData(parsedData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, status, navigate, bulkPaymentDataString, bulkPaymentDatas]);

    useBulkPaymentStatusUpdate(
        id,
        role,
        bulkPaymentData[0]?.batchId,
        bulkPaymentData,
        setBulkPaymentData
    );

    const serviceSuccessData = getSuccessPageData(transactionData, bulkPaymentData);
    const {
        title,
        message,
        firstButtonTxt,
        secondButtonTxt,
        firstBtnLink = 'dashboard',
        secondBtnLink = 'reports',
    } = serviceSuccessData || {};
    const titleSentences = seperateSentences(title as string);
    let titleComponent = (
        <Flex vertical>
            <Text className="text-2xl">{title}</Text>
        </Flex>
    );
    if (titleSentences.length > 1) {
        titleComponent = (
            <Flex vertical>
                {titleSentences.map(sentence => (
                    <Text className="text-2xl">{sentence}</Text>
                ))}
            </Flex>
        );
    }

    const {
        transactionDate,
        corporateTxnId,
        serviceOperator,
        amountInINR,
        couponData,
        paymentMode: originalPaymentMode,
        paymentModeResponse,
    } = transactionData || {};
    let paymentMode = resolvePaymentModeCode(originalPaymentMode, paymentModeResponse);
    // Compliance: the issuer must be named wherever an in-app card payment is shown.
    if (paymentMode === 'CORPORATE CARD') {
        paymentMode = 'Corporate Card (Issued by Pine Labs)';
    }
    let orderAmount = parseFloat(amountInINR ?? '0');
    if (couponData && couponData.discountAmount) {
        orderAmount -= couponData.discountAmount;
    }
    const tableData = {
        transactionDate,
        corporateTxnId,
        serviceProvider: getServiceProvider(bbpsAccessKey, serviceOperator?.serviceProvider),
        amount: orderAmount,
        amountInINR: parseFloat(amountInINR ?? '0'),
        couponDiscount: couponData ? couponData?.discountAmount : 0,
        paymentMode,
        billPaymentParams: formattedInput,
        ...(bbpsAccessKey === 'JRI_prepaid' && { mobileNo }),
    };
    const shouldRenderTable = Object.values(tableData).every(value => value !== undefined);
    if (bulkPaymentDataString && bulkDataLoading) {
        return <Skeleton />;
    }

    const serviceAccessKey = transactionData?.serviceOperator?.accessKey || '';
    const isSoftwares = serviceAccessKey === accessKeys.softwares;

    let softwareProductName: string | undefined;
    if (isSoftwares && transactionData?.orderResponse) {
        try {
            const parsed = JSON.parse(transactionData.orderResponse);
            softwareProductName = parsed?.subscriptionDetails?.productName;
        } catch {
            console.log('An error occurred while parsing transactionData.orderResponse');
        }
    }

    return (
        <Flex
            vertical
            justify="center"
            align="center"
            gap={20}
            className={`pgsuccess relative ${bbpsAccessKey && checkIsBBPS(bbpsAccessKey) ? 'pt-16 sm:pt-10' : ''}`}
        >
            {bbpsAccessKey && checkIsBBPS(bbpsAccessKey) && (
                <Flex className="absolute right-0 justify-end w-full top-5">
                    <Image preview={false} width={md ? 110 : 70} src={bbps} />
                </Flex>
            )}

            <Result
                data-testid="lottie-animation"
                className="p-0 md:w-3/6"
                icon={<Lottie options={defaultOptions} height={100} />}
                status="success"
                title={!isLoading && titleComponent}
                subTitle={
                    isLoading ? (
                        <Flex>
                            {md ? (
                                <Skeleton
                                    style={{ minWidth: 400, height: 10 }}
                                    paragraph={{ rows: 2 }}
                                    active
                                />
                            ) : (
                                <Skeleton
                                    style={{ minWidth: 200, height: 10 }}
                                    paragraph={{ rows: 2 }}
                                    active
                                />
                            )}
                        </Flex>
                    ) : (
                        message
                    )
                }
                extra={[
                    isLoading ? (
                        <Flex>
                            {md ? (
                                <Skeleton.Button
                                    key="skeleton"
                                    style={{ minWidth: 400, height: 30 }}
                                    active
                                />
                            ) : (
                                <Skeleton.Button
                                    key="skeleton"
                                    style={{ minWidth: 200, height: 20 }}
                                    className="w-full"
                                    active
                                />
                            )}
                        </Flex>
                    ) : (
                        <Flex
                            justify="center"
                            className="flex flex-col gap-4 sm:flex-row"
                            key="btn"
                        >
                            <Link to={`/${firstBtnLink}`}>
                                <Button type="primary" danger>
                                    {firstButtonTxt || 'Go to Dashboard'}
                                </Button>
                            </Link>
                            {secondButtonTxt && (
                                <Link to={`/${secondBtnLink}`}>
                                    <Button>{secondButtonTxt}</Button>
                                </Link>
                            )}
                        </Flex>
                    ),
                ]}
            />
            {shouldRenderTable && <PaymentResultTable paymentData={tableData} />}
            {bulkPaymentData.length > 0 && (
                <Table
                    className="mt-7"
                    scroll={{ x: 882 }}
                    dataSource={bulkPaymentData}
                    columns={BulkUploadColumn()}
                    pagination={false}
                />
            )}
            {isSoftwares && !bulkPaymentDataString && shouldRenderTable && (
                <PaymentResultSoftwares productName={softwareProductName} />
            )}
        </Flex>
    );
};

export default PaymentSuccess;
