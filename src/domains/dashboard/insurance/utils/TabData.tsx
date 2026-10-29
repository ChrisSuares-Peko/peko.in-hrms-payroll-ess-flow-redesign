import { TabsProps } from 'antd';

import ClaimProcessTab from '../components/ClaimProcessTab';
import FeaturesTab from '../components/FeaturesTab';
import SecondTab from '../components/SecondTab';

export const detailPageTabs: TabsProps['items'] = [
    {
        key: '1',
        label: 'Features',
        children: <FeaturesTab />,
    },
    {
        key: '2',
        label: 'Cashless hospitals',
        children: <SecondTab />,
    },
    {
        key: '3',
        label: 'Claim Process',
        children: <ClaimProcessTab />,
    },
];
