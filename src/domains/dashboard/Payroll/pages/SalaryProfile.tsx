import { Tabs, TabsProps } from 'antd';

import {
    LeaveSummary,
    Reimbursement,
    Extras,
    Gratuity,
    Deductions,
    Increment,
} from '../components/SalaryProfile';
import StatutoryComponent from '../components/SalaryProfile/StatutoryComponent';

const SalaryProfile: React.FC = () => {
    const items: TabsProps['items'] = [
       
        {
            key: '2',
            label: 'Extras ',
            children: <Extras />,
        },
        {
            key: '3',
            label: 'Leave Summary',
            children: <LeaveSummary />,
        },
        {
            key: '4',
            label: 'Reimbursement ',
            children: <Reimbursement />,
        },
        {
            key: '5',
            label: 'Deductions',
            children: <Deductions />,
        },
        {
            key: '6',
            label: 'Calculate Gratuity ',
            destroyInactiveTabPane: true,
            children: <Gratuity />,
        },
        {
            key: '7',
            label: 'Increment',
            children: <Increment />,
        },
        {
            key: '8',
            label: 'Wps ',
            children: 'Wps Comming soon',
            disabled: true,
        },
        {
            key: '9',
            label: <span style={{ color: '#667085' }}>Statutory Components</span>,
            children: <StatutoryComponent />,
        },
    ];
    return <Tabs className="mt-4 p-0 m-0" defaultActiveKey="1" items={items} />;
};

export default SalaryProfile;
