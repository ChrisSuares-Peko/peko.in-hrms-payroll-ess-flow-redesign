import type { FC } from 'react';

import { Result, Flex, Descriptions } from 'antd';
import Moment from 'moment';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

interface RegistrationSuccessProps {}

const RegistrationSuccess: FC<RegistrationSuccessProps> = () => {
    const formattedDateTime = Moment(new Date()).format('MMMM DD YYYY hh:mm:ss a');
    return (
        <Flex vertical justify="center" align="center" gap={20}>
            <Result
                className="md:w-3/6  p-0"
                icon={<Lottie options={defaultOptions} height={100} />}
                status="success"
                title="WPS Registration Submited!"
                subTitle="Congratulations! Your corporate tax registration with the UAE Ministry of Finance has been successfully completed."
                extra={[]}
            />
            <Descriptions bordered size="middle" column={1} className="lg:w-2/3 pg-success-table">
                <Descriptions.Item label="Date:">{formattedDateTime}</Descriptions.Item>
                <Descriptions.Item label="VAT TRN (Tax Registration Number):">
                    230721131720793050
                </Descriptions.Item>
                <Descriptions.Item label="Registered Business Name:">Savoll LLC</Descriptions.Item>
            </Descriptions>
        </Flex>
    );
};

export default RegistrationSuccess;
