import React from 'react';

import { Result, Button, Flex } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import otherSuccess from '@assets/animation/other-success.json';
import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { paths } from '@src/routes/paths';

interface props {
    title?: string;
    message?: string;
    firstButtonTxt?: string;
    secondButtonTxt?: string;
    children?: React.ReactNode;
    isOtherSuccess?: boolean;
    firstBtnLink?: string;
    secondBtnLink?: string;
}

const EmployeeAddSuccess = ({
    title: propTitle,
    message: propMessage,
    firstButtonTxt,
    secondButtonTxt,
    children,
    isOtherSuccess,
    firstBtnLink,
    secondBtnLink,
}: props) => {
    const navigate = useNavigate();
    const defaultOptions = {
        loop: false,
        autoplay: true,
        animationData: isOtherSuccess ? otherSuccess : paymentSuccess,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };
    const iconSize = isOtherSuccess ? 40 : 80;

    const title = 'New Employee Added Successfully';

    return (
        <Flex vertical justify="center" align="center" gap={30}>
            <Result
                className="md:w-3/6 p-0"
                icon={<Lottie options={defaultOptions} height={iconSize} width={iconSize} />}
                status="success"
                title={title}
                extra={[
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            navigate(`/${paths.payroll.index}`);
                        }}
                    >
                        Go to HR Dashboard
                    </Button>,
                    <Button
                        onClick={() =>
                            navigate(
                                `${paths.dashboard.payroll}/${paths.payroll.employees}/${paths.payroll.addEmployee}`
                            )
                        }
                    >
                        Add another employee
                    </Button>,
                ]}
            />
            {children}
        </Flex>
    );
};

export default EmployeeAddSuccess;
