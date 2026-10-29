import React from 'react';

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Result } from 'antd';

import useNotification from '../hooks/useNotification';

// this component is only for sub corporate users
const ServiceNotPurchased = () => {
    const { isLoading } = useNotification();
    const handleNotification = async () => {
        // if (!notificationExists) {
        // await sendNotification();
        //   }
    };
    return (
        <Flex vertical justify="center" align="center" gap={50}>
            <Result
                className="w-3/4"
                icon={<ExclamationCircleOutlined />}
                status="warning"
                title="Service Upgrade Required"
                subTitle="Your current plan does not include access to these features. 
                      Only the admin can upgrade. To unlock all premium features, please contact your admin to upgrade the service"
                extra={
                    <Button
                        type="primary"
                        danger
                        className="px-6"
                        onClick={handleNotification}
                        loading={isLoading}
                        // disabled={notificationExists}
                    >
                        Notify Admin
                    </Button>
                }
            />
        </Flex>
    );
};

export default ServiceNotPurchased;
