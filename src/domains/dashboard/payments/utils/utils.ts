import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';

import { billPayments } from '../../billPayments/utils/data';
import { BulkPaymentResp, TransactionDetailsResponse } from '../types/index';

interface SuccessPageData {
    accessKey?: string;
    title: string;
    message: string;
    firstButtonTxt: string;
    firstBtnLink: string;
    secondButtonTxt?: string;
    secondBtnLink?: string;
}

export function getSuccessPageData(
    transactionData: TransactionDetailsResponse | undefined,
    bulkPaymentData: BulkPaymentResp[]
): SuccessPageData | undefined {
    const serviceAccessKey = transactionData?.serviceOperator?.accessKey || '';
    const {
        prepaid,
        hotels,
        airline,
        officeSupplies,
        subscriptions,
        softwares,
        shipmentServices,
        giftCards,
        CarbonFootprint,
        officeAddress,
        whatsappBasic,
        emailDomain,
        hike,
        eSim,
        pekoWorks,
        postpaid,
        domainAndHosting,
        xoxoday,
        busTickets,
        vehicleReports,
        globalBusinessSetup,
        corporateCards,
    } = accessKeys;

    let orderResponse;
    if (transactionData?.orderResponse && serviceAccessKey === accessKeys.officeAddress) {
        orderResponse = JSON.parse(transactionData?.orderResponse);
    }

    let logisticsOrderResponse: any = null;
    if (transactionData?.orderResponse && serviceAccessKey === accessKeys.shipmentServices) {
        try { logisticsOrderResponse = JSON.parse(transactionData.orderResponse); } catch { /* empty */ }
    }
    let cardsOrderResponse: { cardLast4?: unknown } | null = null;
    if (transactionData?.orderResponse && serviceAccessKey === accessKeys.corporateCards) {
        try { cardsOrderResponse = JSON.parse(transactionData.orderResponse); } catch { /* empty */ }
    }
    const cardLast4 = /^\d{4}$/.test(String(cardsOrderResponse?.cardLast4 ?? ''))
        ? String(cardsOrderResponse?.cardLast4)
        : null;

    const logisticsTrackingNo = logisticsOrderResponse?.isReturn
        ? logisticsOrderResponse?.deliveredTxnId
        : transactionData?.corporateTxnId;

    const isBillPayment = checkIsBBPS(serviceAccessKey);
    if (Array.isArray(bulkPaymentData) && bulkPaymentData.length > 0) {
        if (bulkPaymentData[0]?.serviceName === 'esim') {
            return {
                title: 'Your payment for eSIM bulk purchase was successful. Go to Orders to install eSIMs',
                message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
                firstButtonTxt: 'Go to Order History',
                firstBtnLink: `${paths.dashboard.corporateTravel.slice(1)}/${paths.esim.index}/${paths.esim.orders}`,
                secondButtonTxt: 'View Transaction',
                secondBtnLink: paths.dashboard.reports.slice(1),
            };
        }
        // transactionData will be not av
        return {
            title: 'Your bill payment was successful',
            message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
            firstButtonTxt: 'Go to Utility Payments',
            firstBtnLink: `${paths.billPayments.index}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        };
    }
    if (isBillPayment) {
        const matchedPayment = billPayments.find(payment => payment.accessKey === serviceAccessKey);
        const title = matchedPayment?.title || '';
        return {
            title: `Your bill payment for ${title} (${transactionData?.accountNo}) was successful`,
            message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
            firstButtonTxt: 'Go to Utility Payments',
            firstBtnLink: paths.billPayments.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        };
    }

    const array = [
        {
            accessKey: prepaid,
            title: 'Mobile Recharge Successful',
            message: 'You will receive a confirmation email shortly. Thank you for using Peko.',
            firstButtonTxt: 'Go to Mobile Recharge & Bills',
            firstBtnLink: paths.telecomPayments.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: postpaid,
            title: 'Mobile Recharge Successful',
            message: 'You will receive a confirmation email shortly. Thank you for using Peko.',
            firstButtonTxt: 'Go to Mobile Recharge & Bills',
            firstBtnLink: paths.telecomPayments.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: hotels,
            title: 'Your payment for hotel booking was successful',
            message: 'You will receive a confirmation email shortly. Thank you for using Peko.',
            firstButtonTxt: 'Go to Manage Bookings',
            firstBtnLink: `${paths.dashboard.corporateTravel.slice(1)}/${paths.hotels.index}/${paths.hotels.manageBookings}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: airline,
            title: 'Your payment for flight ticket booking was successful',
            message: 'You will receive a confirmation email shortly. Thank you for using Peko.',
            firstButtonTxt: 'Go to Manage Bookings',
            firstBtnLink: `${paths.dashboard.corporateTravel.slice(1)}/${paths.airline.index}/${paths.airline.manage}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: officeSupplies,
            title: 'Your payment has been successful!',
            message:
                'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
            firstButtonTxt: 'Go to Office Supplies',
            firstBtnLink: paths.officeSupplies.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: subscriptions,
            title: 'Your payment has been successful!',
            message:
                'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
            firstButtonTxt: 'Go to Softwares',
            firstBtnLink: paths.subscriptions.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
         {
            accessKey: softwares,
            title: 'Your payment has been successful',
            message: `You will receive a confirmation email shortly. Thank you for choosing Peko.`,
            firstButtonTxt: 'Go to Softwares',
            firstBtnLink: paths.softwares.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: `${paths.softwares.index}/${paths.softwares.orderHistory}`,
        },
        {
            accessKey: pekoWorks,
            title: 'Your payment has been successful!',
            message:
                'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
            firstButtonTxt: 'Go to works',
            firstBtnLink: paths.dashboard.works,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: shipmentServices,
            title: 'Your payment for Logistics service was successful',
            message:
                'You will receive a confirmation email shortly. Thank you for using Peko.',
            firstButtonTxt: 'Track your order',
            firstBtnLink: `${paths.logistics.index}/${paths.logistics.orderHistory}/${paths.logistics.trackOrderDetails}?trackingNo=${logisticsTrackingNo}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: corporateCards,
            title: 'Your payment for the physical card was successful',
            message: cardLast4
                ? `Your card ending ${cardLast4} has been ordered and will be dispatched soon. You will receive a confirmation email shortly.`
                : 'Your physical card will be dispatched soon after confirmation. You will receive a confirmation email shortly.',
            firstButtonTxt: 'Go to Corporate Cards',
            firstBtnLink: paths.dashboard.corporateCard,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: giftCards,
            title: 'Your payment for Gift Card purchase was successful ',
            message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
            firstButtonTxt: 'Go to Gift Cards',
            firstBtnLink: paths.giftcards.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: xoxoday,
            title: 'Your payment for Gift Card purchase was successful ',
            message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
            firstButtonTxt: 'Go to Gift Cards',
            firstBtnLink: paths.giftcards.index,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: CarbonFootprint,
            title: 'Your payment has been successful!',
            message:
                'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
            firstButtonTxt: 'Go to Zero Carbon',
            firstBtnLink: `${paths.dashboard.zeroCarbon}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: officeAddress,
            title: 'Your payment has been successful!',
            message: ` Thank you for choosing Peko as your business address provider. ${orderResponse?.bookingDetails?.address ? `We are excited to inform you that your new office address is now located in the ${orderResponse?.bookingDetails?.address}` : 'We are pleased to inform you that your new office address has been booked'}. A confirmation email will be sent to you shortly.`,
            firstButtonTxt: 'Go to Office Address',
            firstBtnLink: paths.dashboard.officeAddress,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: whatsappBasic,
            title: 'Your payment has been successful',
            message: 'You will receive a confirmation email shortly.Thank you for choosing Peko.',
            firstButtonTxt: 'Go to WhatsApp Dashboard',
            firstBtnLink: paths.dashboard.whatsappForBusiness.slice(1),
            secondButtonTxt: 'View Transaction',
            secondBtnLink: `${paths.dashboard.whatsappForBusiness.slice(1)}/${paths.whatsappForBusiness.reviewOrder}`,
        },
        {
            accessKey: emailDomain,
            title: 'Your payment for Business Emails service was successful',
            message: `You will receive a confirmation email shortly. Thank you for choosing Peko.`,
            firstButtonTxt: 'Go to Business Emails',
            firstBtnLink: paths.dashboard.emailDomain,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: hike,
            title: 'Your payment for Hike service was successful',
            message: `You will receive a confirmation email shortly. Thank you for choosing Peko.`,
            firstButtonTxt: 'Go to Hike',
            firstBtnLink: paths.dashboard.hike,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: domainAndHosting,
            title: 'Transaction Successful',
            message:
                'Your Payment for Domain and Hosting Services was successful. You will receive a confirmation Email Shortly. Thank you for Using Peko',
            firstButtonTxt: 'Manage Purchase',
            firstBtnLink: `${paths.dashboard.domainHosting.slice(1)}/${paths.domainHosting.manageSubscription}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: globalBusinessSetup,
            title: 'Your payment for Global Business Setup was successful',
            message:
                'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
            firstButtonTxt: 'Go to Ongoing Setups',
            firstBtnLink: `${paths.globalBusinessSetup.index}/${paths.globalBusinessSetup.ongoingSetups}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: vehicleReports,
            title: 'Payment successful',
            message:
                'We are building your report. We will notify you via email once the report is ready.',
            firstButtonTxt: 'View Order',
            firstBtnLink: `${paths.dashboard.turbo.slice(1)}/${paths.turbo.vehicleReports}/${paths.turbo.reportOrders}`,
            secondButtonTxt: 'Back to car report',
            secondBtnLink: `${paths.dashboard.turbo.slice(1)}/${paths.turbo.vehicleReports}`,
        },
        {
            accessKey: eSim,
            title: 'Your payment for eSIM purchase was successful. Go to Orders to install your eSIM',
            message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
            firstButtonTxt: 'Go to Order History',
            firstBtnLink: `${paths.dashboard.corporateTravel.slice(1)}/${paths.esim.index}/${paths.esim.orders}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: accessKeys.eSimTunz,
            title: 'Your payment for eSIM purchase was successful. Go to Orders to install your eSIM',
            message: `You will receive a confirmation email shortly. Thank you for using Peko.`,
            firstButtonTxt: 'Go to Order History',
            firstBtnLink: `${paths.dashboard.corporateTravel.slice(1)}/${paths.esim.index}/${paths.esim.orders}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
        {
            accessKey: busTickets,
            title: 'Your Payment For Bus Ticket Booking Was Successful!',
            message: 'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
            firstButtonTxt: 'Go to Manage Bookings',
            firstBtnLink: `${paths.dashboard.corporateTravel.slice(1)}/${paths.bus.index}/${paths.bus.manageBookings}`,
            secondButtonTxt: 'View Transaction',
            secondBtnLink: paths.dashboard.reports.slice(1),
        },
    ];

    const defaultData = {
        title: 'Your payment has been successful!',
        message:
            'You will receive a confirmation email once the process is completed. Thank you for choosing Peko.',
        firstButtonTxt: 'Go to Dashboard',
        firstBtnLink: paths.dashboard.home.slice(1),
        secondButtonTxt: 'View Transaction',
        secondBtnLink: paths.dashboard.reports.slice(1),
    };

    // GBS shares one accessKey for new-setup and renewal flows; the renewal
    // path writes `{ renewalId }` into orderResponse. Detect it to switch copy + CTA.
    if (serviceAccessKey === accessKeys.globalBusinessSetup && transactionData?.orderResponse) {
        let gbsOrderResponse: any = null;
        try {
            gbsOrderResponse = JSON.parse(transactionData.orderResponse);
        } catch {
            gbsOrderResponse = null;
        }
        if (gbsOrderResponse?.renewalId) {
            return {
                accessKey: accessKeys.globalBusinessSetup,
                title: 'Your renewal payment was successful',
                message:
                    'Your renewal request is now being processed. You will receive a confirmation email shortly. Thank you for using Peko.',
                firstButtonTxt: 'Go to Renewals',
                firstBtnLink: `${paths.globalBusinessSetup.index}/${paths.globalBusinessSetup.renewals}`,
                secondButtonTxt: 'View Transaction',
                secondBtnLink: paths.dashboard.reports.slice(1),
            };
        }
    }

    const serviceSuccessData = array.find(obj => obj.accessKey === serviceAccessKey);
    return serviceSuccessData || defaultData;
}

export function checkIsBBPS(serviceAccessKey: string) {
    const {
        broadband,
        education,
        electricity,
        landline,
        pipedGas,
        water,
        lpg,
        bbps_subscriptions,
        Insurance,
        test,
    } = accessKeys;

    const billPaymentAccessKeys = [
        broadband,
        education,
        electricity,
        landline,
        pipedGas,
        water,
        lpg,
        bbps_subscriptions,
        Insurance,
        test,
    ];
    return billPaymentAccessKeys.includes(serviceAccessKey);
}

export function formatParamName(paramName: string) {
    if (!paramName) return null;

    const words = paramName.split(' ');

    if (words.length === 1 && words[0].toLowerCase().endsWith('id')) {
        return `${words[0].slice(0, -2)} ID`;
    }

    if (words.length === 2 && words[1].toLowerCase() === 'id') {
        return `${words[0][0].toUpperCase() + words[0].slice(1).toLowerCase()} ID`;
    }

    return (
        words[0][0].toUpperCase() +
        words[0].slice(1).toLowerCase() +
        (words[1] ? ` ${words[1].toLowerCase()}` : '')
    );
}
