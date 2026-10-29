import React, { useEffect, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';
import { useLocation } from 'react-router-dom';

import useVerifyEmailStatusApi from '../../hooks/useEmailVerificationStatusApi';
import EmailIdAlreadyVerified from '../sections/EmailIdAlreadyVerified';
import EmailIdLinkExpired from '../sections/EmailIdLinkExpired';
import EmailIdVerificationFailed from '../sections/EmailIdVerficationFailed';
import EmailIdVerified from '../sections/EmailIdVerified';

const EmailIdStatusView = () => {
    const [statusData, setStatusData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { handleEmailVerificationStatus } = useVerifyEmailStatusApi();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');
        if (token) {
            const correctedToken = token.replace(/ /g, '+');
            (async () => {
                try {
                    const response = await handleEmailVerificationStatus(correctedToken);
                    setStatusData(response);
                } catch (error) {
                    console.error('Failed to verify email status:', error);
                    setStatusData(null);
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [location, handleEmailVerificationStatus]);

    // eslint-disable-next-line consistent-return
    const renderComponentBasedOnStatus = () => {
        if (loading) {
            return (
                <Flex className="items-center justify-center" style={{ height: '70vh' }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </Flex>
            );
        }

        if (!statusData) {
            return <EmailIdVerificationFailed />;
        }

        const { data, message, responseCode } = statusData;

        if (data?.linkExpired) {
            return <EmailIdLinkExpired />;
        }

        if (data?.isEmailAlreadyVerified) {
            return <EmailIdAlreadyVerified />;
        }

        if (data?.emailVerified) {
            return <EmailIdVerified />;
        }

        if (message === 'something went wrong while verifying' && responseCode === '001') {
            return <EmailIdVerificationFailed />;
        }
    };

    return (
        <Flex className="" style={{ height: '70vh' }}>
            {renderComponentBasedOnStatus()}
        </Flex>
    );
};

export default EmailIdStatusView;
