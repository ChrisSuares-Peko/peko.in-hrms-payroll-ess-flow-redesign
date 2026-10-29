import { Button, Result, Row, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';

const PaymentFailure = () => {
    const location = useLocation();
    return (
        <Row className="flex justify-center items-center h-full">
            <Result
                className="md:w-3/6 p-0"
                status="error"
                title="Your transaction has failed"
                subTitle={
                    <Typography.Text className="text-sm">
                        We regret to inform you that your attempt to payment was unsuccessful. If
                        any funds are deducted from your account, please be assured that the refund
                        will be processed within seven working days.
                    </Typography.Text>
                }
                extra={
                    <Link to="/peko-wallet" state={{ from: location }}>
                        <Button type="primary" danger className="px-6">
                            Try Again
                        </Button>
                    </Link>
                }
            />
        </Row>
    );
};

export default PaymentFailure;
