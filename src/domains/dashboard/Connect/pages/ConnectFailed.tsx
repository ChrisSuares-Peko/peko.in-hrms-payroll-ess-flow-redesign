import React from 'react';

import { Button, Result, Row, theme, Typography } from 'antd';

const ConnectFailed = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const handleRetry = () => {
        window.history.back();
    };

    return (
        <Row className="justify-center">
            <Result
                status="error"
                className="md:w-3/6"
                title="Your Connect request has been failed"
                subTitle={
                    <Typography.Text style={{ fontSize: '15px' }}>
                        Your connection request was failed. Please try again.
                    </Typography.Text>
                }
                extra={
                    <Button
                        onClick={handleRetry}
                        style={{ backgroundColor: colorPrimary, color: 'white' }}
                    >
                        Try Again
                    </Button>
                }
            />
        </Row>
    );
};
export default ConnectFailed;
