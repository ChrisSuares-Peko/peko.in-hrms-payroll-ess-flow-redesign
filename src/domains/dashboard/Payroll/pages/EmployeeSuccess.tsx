import React from 'react';

import { Result, Button, Flex } from 'antd';
import Lottie from 'react-lottie';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import otherSuccess from '@assets/animation/other-success.json';
import paymentSuccess from '@assets/animation/paymentSuccess2.json';

import { useGetExcelProcessSalaryApi } from '../hooks/employeeSalaryHooks/salaryTableHooks/useGetExcelProcessSalaryApi';

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

const SuccessScreen = ({
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
    const location = useLocation();
    const { month, year } = location.state || {};
    if (month === 'undefined' || year === 'undefined') {
        navigate('/payroll/employees-salary');
    }
    const iconSize = isOtherSuccess ? 40 : 80;

    const title = propTitle ?? 'Payroll Processing Successfully Completed!';

    const message =
        propMessage ??
        "Your employees's salaries have been processed and approved, ensuring smooth operations for your workforce.";

    const { getExcelProcessSalaryList, isLoading } = useGetExcelProcessSalaryApi();
    return (
        <Flex vertical justify="center" align="center" gap={30}>
            <Result
                className="md:w-3/6 p-0"
                icon={<Lottie options={defaultOptions} height={iconSize} width={iconSize} />}
                status="success"
                title={title}
                subTitle={message}
                extra={[
                    <Link to="/payroll" key="downloadBtn">
                        <Button type="primary" danger>
                            {' '}
                            Go to Payroll Dashboard{' '}
                        </Button>
                    </Link>,

                    <Button
                        onClick={() => getExcelProcessSalaryList(month, year)}
                        loading={isLoading}
                    >
                        {' '}
                        Download Excel File{' '}
                    </Button>,
                ]}
            />
            {children}
        </Flex>
    );
};

export default SuccessScreen;
