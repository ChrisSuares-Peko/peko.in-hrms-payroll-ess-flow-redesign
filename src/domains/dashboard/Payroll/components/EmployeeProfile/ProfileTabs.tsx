import { FC, useState } from 'react';

import { Tabs } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import EmployeeInfo from './EmployeeInfo';
import PersonalInformation from './PersonalInformation';
import SalaryInfo from './SalaryInfo';

interface ProfileTabsProps {
    isLoading?: boolean;
    setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProfileTabs: FC<ProfileTabsProps> = ({ isLoading, setIsLoading }: ProfileTabsProps) => {
    const [activeTab, setActiveTab] = useState<string>('1');

    const nextTab = (key: string) => {
        setActiveTab(key);
    };
    const { xl } = useScreenSize();
    const items = [
        {
            key: '1',
            label: 'Personal Information',
            children: <PersonalInformation nextTab={nextTab} />,
            disabled: true,
        },
        {
            key: '2',
            label: 'Employee Information',
            children: <EmployeeInfo nextTab={nextTab} />,
            disabled: true,
        },
        {
            key: '3',
            label: 'Salary Information',
            children: <SalaryInfo nextTab={nextTab} />,
            disabled: true,
        },
    ];

    return (
        <Tabs
            activeKey={activeTab}
            items={items}
            onChange={nextTab}
            centered
            tabBarGutter={xl ? 160 : 30}
        />
    );
};

export default ProfileTabs;
