import { useEffect } from 'react';

import { Flex, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { paths } from '@src/routes/paths';

import ActivatePaymentCollections from '../../paymentLinks/components/ActivatePaymentCollections';
import { usePaymentLinkOnboarding } from '../../paymentLinks/hooks/usePaymentLinkOnboarding';

const PayrollAccountSetup = () => {
    useScrollToTop();
    const navigate = useNavigate();
    const { loading, fetchStatus, record } = usePaymentLinkOnboarding();

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (record?.status === 'active') {
            navigate(`/${paths.payroll.index}/${paths.payroll.salaryDashboard}`, {
                replace: true,
            });
        }
    }, [record?.status, navigate]);

    if (loading) {
        return (
            <Flex justify="center" align="center" className="h-[70vh]">
                <Spin size="large" />
            </Flex>
        );
    }

    return (
        <ActivatePaymentCollections
            onCancel={() => navigate(`/${paths.payroll.index}/${paths.payroll.salaryDashboard}`)}
            onActivated={fetchStatus}
            initialData={record}
            refresh={fetchStatus}
            title='Salary Rollout'
        />
    );
};

export default PayrollAccountSetup;
