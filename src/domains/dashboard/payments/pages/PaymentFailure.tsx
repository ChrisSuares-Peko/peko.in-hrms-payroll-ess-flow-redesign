import { useEffect } from 'react';

import { Button, Result, Row, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { RESPONSE_CODE } from '@src/services/responseCodes';
import { accessKeys } from '@utils/accessKeys';

import useRestartFlightBooking from '../../Airline/hooks/useRestartFlightBooking';
import { PaymentFailureState } from '../types/index';

const GENERIC_MESSAGE =
    'We regret to inform you that your attempt to payment was unsuccessful. If any funds are deducted from your account, please be assured that the refund will be processed within seven working days.';

const SESSION_EXPIRED_MESSAGE =
    'Your flight booking session expired before the ticket could be issued. Fares and seat availability may have changed, so please start a new search. Any amount deducted will be refunded within seven working days.';

const FLIGHT_FAILED_MESSAGE =
    'We could not issue your ticket, so the booking was not completed. Fares and seat availability may have changed, so please start a new search. Any amount deducted will be refunded within seven working days.';

const PaymentFailure = () => {
    const location = useLocation();
    const { responseCode, errorMessage, showReason } =
        (location.state as PaymentFailureState) ?? {};
    const { payload } = useAppSelector(state => state.reducer.payment);
    const restartFlightBooking = useRestartFlightBooking();

    const isFlightBooking = payload?.accessKey === accessKeys.airline;
    const isSessionExpired =
        responseCode === RESPONSE_CODE.SESSION_EXPIRED ||
        /session.*expired/i.test(errorMessage ?? '');

    useEffect(() => {
        // Seeded during checkout (same sessionStorage key the success page reads) — it's left
        // untouched on failure since the success page only clears it inside its own
        // status === 'success' branch, so it's still here to read.
        const paymentResultRaw = sessionStorage.getItem('paymentResult');
        if (paymentResultRaw && typeof Moengage?.track_event === 'function') {
            try {
                const paymentResult = JSON.parse(paymentResultRaw);
                if (paymentResult.serviceName) {
                    Moengage.track_event(`${paymentResult.serviceName}_payment_result`, {
                        status: 'failed',
                        total_amount: paymentResult.total_amount,
                        coupon_code_used: paymentResult.coupon_code_used,
                    });
                }
            } catch (_) { /* ignore parse errors */ }
        }
        sessionStorage.removeItem('paymentResult');
    }, []);

    let title = 'Your transaction has failed';
    let message = GENERIC_MESSAGE;
    if (isFlightBooking) {
        title = isSessionExpired
            ? 'Your flight booking session has expired'
            : 'Your flight booking could not be completed';
        message = isSessionExpired ? SESSION_EXPIRED_MESSAGE : FLIGHT_FAILED_MESSAGE;
    } else if (showReason && errorMessage) {
        message = `${errorMessage} No amount has been taken for this attempt. You can try again or choose another payment method.`;
    }

    // Retrying from the payment summary would re-send the dead TraceId and fail again.
    const retryButton = isFlightBooking ? (
        <Button type="primary" danger className="px-6" onClick={restartFlightBooking}>
            Search Again
        </Button>
    ) : (
        <Link to="/payments" state={{ from: location }}>
            <Button type="primary" danger className="px-6">
                Try Again
            </Button>
        </Link>
    );

    return (
        <Row className="flex justify-center items-center h-full">
            <Result
                className="md:w-3/6 p-0"
                status="error"
                title={title}
                subTitle={<Typography.Text className="text-sm">{message}</Typography.Text>}
                extra={retryButton}
            />
        </Row>
    );
};

export default PaymentFailure;
