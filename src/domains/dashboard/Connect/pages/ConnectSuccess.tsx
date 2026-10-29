import React, { useEffect } from 'react';

import { Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import SuccessScreen from '@components/molecular/success/SuccessScreen';
import { paths } from '@src/routes/paths';

import { ConnectRequestResponse } from '../types/index';

const ConnectSuccess = () => {
    const location = useLocation();
    const data: ConnectRequestResponse = location.state?.data;
    const navigate = useNavigate();
    useEffect(() => {
        if (!data) {
            navigate(`/${paths.connect.index}`);
        }
    }, [data, navigate]);
    return (
        <Content className="mt-20 ">
            <SuccessScreen
                title="Thank you for your enquiry"
                message={`Your enquiry has been received. A representative from ${data?.serviceProvider} will be in touch with you shortly.`}
                isOtherSuccess
                firstButtonTxt="Go to Marketplace"
                firstBtnLink={paths.connect.index}
            >
                <Typography.Text className="text-xs text-center sm:text-base">
                    For any queries or support, please contact us at
                    <Link to={`/${paths.needHelp.index}`}>
                        <Typography.Text className="text-xs text-center underline sm:text-base ms-1 text-textBlack">
                            reach@peko.one
                        </Typography.Text>
                    </Link>
                </Typography.Text>
            </SuccessScreen>
        </Content>
    );
};

export default ConnectSuccess;
