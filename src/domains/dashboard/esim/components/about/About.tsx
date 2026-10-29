import React from 'react';

import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

import Installation from './Installation';
import Welcome from './Welcome';

const onChange = (key: string) => {
    console.log(key);
};

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'About Float',
        children: <Welcome />,
    },
    {
        key: '2',
        label: ' Installation Guidelines ',
        children: <Installation />,
    },
    // {
    //     key: '3',
    //     label: ' Terms & Conditions',
    //     children: 'Terms & Conditions',
    // },
];

const About: React.FC = () => <Tabs defaultActiveKey="1" items={items} onChange={onChange} />;

export default About;
