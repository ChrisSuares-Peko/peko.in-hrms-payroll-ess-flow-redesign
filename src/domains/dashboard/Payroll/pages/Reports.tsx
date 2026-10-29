import React, { useEffect, useState } from 'react';

import { Tabs, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import Form16Tab from '../components/Reports/Form16Tab';
import Form24QTab from '../components/Reports/Form24QTab';
import IncomeDeclarationTab from '../components/Reports/IncomeDeclarationTab';
import TDSTab from '../components/Reports/TDSTab';

const Reports = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTabKey, setActiveTabKey] = useState('1');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const activeTab = queryParams.get('activeTab');

        if (activeTab) {
            setActiveTabKey(activeTab);
        }
    }, [location]);

    const onChange = (key: string) => {
        setActiveTabKey(key);
        navigate(`?activeTab=${key}`);
    };

    const items = [
        {
            key: '1',
            label: 'TDS',
            children: <TDSTab />,
        },
        {
            key: '2',
            label: 'Income Declaration Form',
            children: <IncomeDeclarationTab />,
        },
        {
            key: '3',
            label: 'Form 24Q',
            children: <Form24QTab />,
        },
        {
            key: '4',
            label: 'Form 16',
            children: <Form16Tab />,
        },
    ];

    return (
        <>
            <Typography.Text className="font-normal text-lg sm:text-2xl">
                Reports & Forms
            </Typography.Text>
            <Tabs className="" activeKey={activeTabKey} items={items} onChange={onChange} />
        </>
    );
};

export default Reports;
