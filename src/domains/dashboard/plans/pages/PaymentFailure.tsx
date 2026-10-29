import { useEffect } from 'react';

import { Button, Result, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const PaymentFailure = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Seeded during checkout (same sessionStorage key the success page reads) — it's left
        // untouched on failure since the success page only clears it inside its own
        // status === 'success' branch, so it's still here to read.
        const result = sessionStorage.getItem('paymentResult');
        if (result && typeof Moengage?.track_event === 'function') {
            try {
                const successData = JSON.parse(result);
                if (successData?.isGroupPlan) {
                    Moengage.track_event('peko_plan_payment_result', {
                        status: 'failed',
                        final_amount: successData?.total_amount,
                    });
                } else if (successData?.serviceName) {
                    const moengageServiceName = successData.serviceName
                        .toLowerCase()
                        .replace(/\s+/g, '_');
                    Moengage.track_event(`${moengageServiceName}_payment_result`, {
                        status: 'failed',
                        total_amount: successData?.total_amount,
                    });
                }
            } catch (_) { /* ignore parse errors */ }
        }
        sessionStorage.removeItem('paymentResult');
    }, []);

    return (
        <Content className="p-10 lg:py-20 lg:px-32 xl:px-40 2xl:px-64">
            <Row className="flex items-center justify-center h-full">
                <Result
                    className="p-0 md:w-3/6"
                    status="error"
                    title="Your transaction has failed"
                    subTitle={
                        <Typography.Text className="text-sm">
                            If any amount has been deducted from your account, please be assured
                            that the refund will be processed within 7 working days.
                        </Typography.Text>
                    }
                    extra={
                        <Button
                            type="primary"
                            danger
                            className="px-6"
                            onClick={() => {
                                navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
                            }}
                        >
                            Try Again
                        </Button>
                    }
                />
            </Row>
        </Content>
    );
};

export default PaymentFailure;
