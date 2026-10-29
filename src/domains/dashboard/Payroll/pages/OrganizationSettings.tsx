import React, { useEffect, useState } from 'react';

import { Tabs, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import ComplianceSettings from './complianceSettings';
import LeavePolicyTable from '../components/LeaveSettings/LeavePolicyTable';
import BankDetails from '../components/organizationSettings/BankDetails/BankDetails';
import EssSettings from '../components/organizationSettings/EssSettings';
import PayrollCycleDetails from '../components/organizationSettings/PayrollCycleDetails';
import PayrollSettingsForm from '../components/organizationSettings/PayrollSettingsForm';
import SalaryComp from '../components/organizationSettings/SalaryComponents/SalaryComp';
import SubscriptionSettings from '../components/organizationSettings/SubscriptionSettings';

const OrganizationSettings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTabKey, setActiveTabKey] = useState('1');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const activeTab = queryParams.get('activeTab');

        if (activeTab === '4') {
            // The old standalone Deductions tab was folded into Salary Components (key '3').
            setActiveTabKey('3');
            navigate('?activeTab=3', { replace: true });
        } else if (activeTab) {
            setActiveTabKey(activeTab);
        }
    }, [location, navigate]);

    const onChange = (key: string) => {
        setActiveTabKey(key);
        navigate(`?activeTab=${key}`);
    };

    const items = [
        {
            key: '1',
            label: 'Company Profile',
            children: <PayrollSettingsForm setActiveTabKey={setActiveTabKey} />,
        },
        {
            key: '2',
            label: 'Payroll Cycle',
            children: <PayrollCycleDetails setActiveTabKey={setActiveTabKey} />,
        },
        {
            key: '3',
            label: 'Salary Components',
            children: <SalaryComp />,
        },
        {
            key: '5',
            label: 'Leave Policies',
            children: <LeavePolicyTable />,
            disabled: false,
        },
        {
            key: '6',
            label: 'Bank Details',
            children: <BankDetails setActiveTabKey={setActiveTabKey} />,
        },
        {
            key: '7',
            label: 'Compliance Settings',
            children: <ComplianceSettings />,
        },
        {
            key: '8',
            label: 'Subscription Settings',
            children: <SubscriptionSettings />,
        },
        {
            key: '9',
            label: 'ESS Settings',
            children: <EssSettings />,
        },
    ];

    return (
        <>
            <Typography.Text className="font-normal text-lg sm:text-2xl">
                Payroll Settings
            </Typography.Text>
            <Tabs className="mt-6" activeKey={activeTabKey} items={items} onChange={onChange} />
        </>
    );
};

export default OrganizationSettings;
